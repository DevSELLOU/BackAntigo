import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import type { Stream } from 'stream';
import type { CreatePresignedUrlDto } from './dtos/create-presigned-url.dto';
import { logger } from 'src/utils/logger';

@Injectable()
export class UploadsService {
  private readonly s3: S3;
  private readonly wasabiEndpoint: string;
  private readonly wasabiBucketName: string;
  private readonly wasabiRegion: string;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    this.wasabiEndpoint = this.configService.get<string>('WASABI_ENDPOINT');
    this.wasabiBucketName =
      this.configService.get<string>('WASABI_BUCKET_NAME');
    this.wasabiRegion = this.configService.get<string>('WASABI_REGION');

    this.s3 = new S3({
      endpoint: this.wasabiEndpoint,
      s3ForcePathStyle: true,
      region: this.wasabiRegion,
      accessKeyId: this.configService.get<string>('WASABI_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>(
        'WASABI_SECRET_ACCESS_KEY',
      ),
      signatureVersion: 'v4',
    });
  }

  async createPresignedUrl(
    createPresignedUrlDto: CreatePresignedUrlDto,
  ): Promise<{
    presignedUrl: string;
    previewUrl: string;
  }> {
    logger.log(
      `[UploadsService] Generating presigned URL for file: ${createPresignedUrlDto.filename}, type: ${createPresignedUrlDto.filetype}`,
    );

    const presignedUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.wasabiBucketName,
      Key: createPresignedUrlDto.filename,
      ContentType: createPresignedUrlDto.filetype,
      Expires: 60 * 60,
    });

    const previewUrl = `${this.wasabiEndpoint}/${this.wasabiBucketName}/${createPresignedUrlDto.filename}`;

    logger.log(
      `[UploadsService] Presigned URL generated, preview URL: ${previewUrl}`,
    );

    return {
      presignedUrl,
      previewUrl,
    };
  }

  async uploadFile(
    stream: Stream,
    filename: string,
    contentType: string = 'application/pdf',
  ): Promise<string> {
    const params = {
      Bucket: this.wasabiBucketName,
      Key: filename,
      Body: stream,
      ContentType: contentType,
    };

    try {
      // The upload method works the same way once the S3 client is configured for Wasabi
      const data = await this.s3.upload(params).promise();
      return data.Location; // This will return the Wasabi URL
    } catch (error) {
      logger.error('Erro ao enviar o arquivo para o Wasabi S3:', error);
      throw error;
    }
  }

  async getFileStream(filename: string): Promise<Stream> {
    const params = {
      Bucket: this.wasabiBucketName,
      Key: filename,
    };

    try {
      // The getObject method works the same way
      return this.s3.getObject(params).createReadStream();
    } catch (error) {
      logger.error('Erro ao buscar o arquivo no Wasabi S3:', error);
      throw error;
    }
  }

  async getFilenameFromUrl(url: string): Promise<string> {
    // Adjust the base URL to match the Wasabi endpoint structure
    const baseURL = `${this.wasabiEndpoint}/${this.wasabiBucketName}/`;

    // Ensure the URL starts with the base URL before replacing
    if (!url.startsWith(baseURL)) {
      logger.warn(
        `URL provided does not start with the expected Wasabi base URL: ${url}`,
      );
      // You might want to throw an error or handle this case differently
      return url.substring(url.lastIndexOf('/') + 1); // Fallback to getting last segment
    }

    const rawFilename = url.replace(baseURL, '');

    // Decode BEFORE splitting, not after: a url that round-tripped through the settings form comes
    // back with its signature already percent-encoded into the path (`file.webp%3FX-Amz-...`), so
    // splitting first would leave the whole thing intact and produce an S3 Key that does not exist.
    // Decoding first turns it back into a real `?`, which the split then removes — which is also
    // what repairs rows already stored that way.
    let decoded = rawFilename;

    try {
      decoded = decodeURIComponent(rawFilename);
    } catch {
      // A filename with a stray `%` is not a valid escape sequence; keep it as-is rather than fail.
    }

    return decoded.split('?')[0];
  }

  /**
   * Signing on every call produced a brand-new URL for the same object each time — a different
   * `X-Amz-Date` and signature — so the storefront handed the browser a different address for the
   * same photo on every page view. Nothing downstream could cache it: Next's image optimizer keys
   * its cache on the URL, so it re-fetched and re-encoded every image on every request.
   *
   * Reusing one signature for most of its validity window makes the URL stable enough to cache
   * without extending how long the signature is valid — the credential still expires on the same
   * schedule it always did.
   */
  private readonly presignedGetCache = new Map<
    string,
    { url: string; reuseUntil: number }
  >();

  /** Stop reusing a signature well before it expires, so no client receives a nearly-dead URL. */
  private static readonly PRESIGNED_REUSE_RATIO = 0.8;

  /** Bounds memory on a catalogue of any size; entries are cheap but must not grow forever. */
  private static readonly PRESIGNED_CACHE_MAX_ENTRIES = 5000;

  async getPresignedGetUrl(
    filename: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> {
    const cacheKey = `${filename}::${expiresInSeconds}`;
    const now = Date.now();

    const cached = this.presignedGetCache.get(cacheKey);
    if (cached && cached.reuseUntil > now) {
      return cached.url;
    }

    const params = {
      Bucket: this.wasabiBucketName,
      Key: filename,
      Expires: expiresInSeconds,
    };

    try {
      const url = await this.s3.getSignedUrlPromise('getObject', params);

      if (
        this.presignedGetCache.size >=
        UploadsService.PRESIGNED_CACHE_MAX_ENTRIES
      ) {
        for (const [key, entry] of this.presignedGetCache) {
          if (entry.reuseUntil <= now) this.presignedGetCache.delete(key);
        }
      }

      this.presignedGetCache.set(cacheKey, {
        url,
        reuseUntil:
          now +
          expiresInSeconds * 1000 * UploadsService.PRESIGNED_REUSE_RATIO,
      });

      return url;
    } catch (error) {
      logger.error(
        `Error generating presigned GET URL for ${filename}:`,
        error,
      );
      throw error;
    }
  }

  async deleteFile(filename: string): Promise<void> {
    const params = {
      Bucket: this.wasabiBucketName,
      Key: filename,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      logger.error('Erro ao deletar arquivo do Wasabi S3:', error);
    }
  }
}
