import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UploadsService } from '../../src/uploads/uploads.service';

const CONFIG: Record<string, string> = {
  WASABI_ENDPOINT: 'https://s3.wasabisys.com',
  WASABI_BUCKET_NAME: 'sellou-images',
  WASABI_REGION: 'us-east-1',
  WASABI_ACCESS_KEY_ID: 'test-key-id',
  WASABI_SECRET_ACCESS_KEY: 'test-secret',
};

describe('UploadsService.getPresignedGetUrl', () => {
  let service: UploadsService;
  let sign: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => CONFIG[key] },
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);

    // Each signature is unique, the way the real SDK stamps a fresh X-Amz-Date every call.
    let counter = 0;
    sign = jest
      .fn()
      .mockImplementation((_operation: string, params: { Key: string }) =>
        Promise.resolve(
          `https://s3.wasabisys.com/sellou-images/${params.Key}?X-Amz-Signature=sig-${++counter}`,
        ),
      );
    (service as any).s3 = { getSignedUrlPromise: sign };
  });

  it('signs the object once and reuses that URL for later callers', async () => {
    const first = await service.getPresignedGetUrl('foto.webp');
    const second = await service.getPresignedGetUrl('foto.webp');

    expect(second).toBe(first);
    expect(sign).toHaveBeenCalledTimes(1);
  });

  it('keeps a separate signature per object', async () => {
    const a = await service.getPresignedGetUrl('foto-a.webp');
    const b = await service.getPresignedGetUrl('foto-b.webp');

    expect(a).not.toBe(b);
    expect(sign).toHaveBeenCalledTimes(2);
  });

  it('does not mix signatures between different expiry windows', async () => {
    const short = await service.getPresignedGetUrl('foto.webp', 3600);
    const long = await service.getPresignedGetUrl('foto.webp', 86400);

    expect(short).not.toBe(long);
    expect(sign).toHaveBeenCalledTimes(2);
  });

  it('re-signs once the reuse window closes, before the credential itself expires', async () => {
    const realNow = Date.now;
    const start = 1_700_000_000_000;
    Date.now = jest.fn(() => start);

    const first = await service.getPresignedGetUrl('foto.webp', 3600);

    // 0.8 of the hour is the reuse cut-off: still inside it, so the same URL must come back.
    Date.now = jest.fn(() => start + 3600 * 1000 * 0.79);
    expect(await service.getPresignedGetUrl('foto.webp', 3600)).toBe(first);

    // Past the cut-off but still inside the hour: a fresh signature, never a stale one.
    Date.now = jest.fn(() => start + 3600 * 1000 * 0.81);
    const renewed = await service.getPresignedGetUrl('foto.webp', 3600);

    expect(renewed).not.toBe(first);
    expect(sign).toHaveBeenCalledTimes(2);

    Date.now = realNow;
  });

  it('propagates a signing failure instead of caching it', async () => {
    sign.mockRejectedValueOnce(new Error('wasabi down'));

    await expect(service.getPresignedGetUrl('foto.webp')).rejects.toThrow(
      'wasabi down',
    );

    const recovered = await service.getPresignedGetUrl('foto.webp');
    expect(recovered).toContain('X-Amz-Signature=');
  });
});

describe('UploadsService.getFilenameFromUrl', () => {
  let service: UploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: ConfigService, useValue: { get: (key: string) => CONFIG[key] } },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('returns the key for a clean stored url', async () => {
    await expect(
      service.getFilenameFromUrl('https://s3.wasabisys.com/sellou-images/1700-foto.webp'),
    ).resolves.toBe('1700-foto.webp');
  });

  it('drops a signature that round-tripped back through a form', async () => {
    // The settings form is shown a presigned url and posts it back. Keeping the query would make
    // the S3 Key `1700-foto.webp?X-Amz-...`, which does not exist, so the image 404s.
    await expect(
      service.getFilenameFromUrl(
        'https://s3.wasabisys.com/sellou-images/1700-foto.webp?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc',
      ),
    ).resolves.toBe('1700-foto.webp');
  });

  it('repairs a key that was already stored with the signature percent-encoded into it', async () => {
    await expect(
      service.getFilenameFromUrl(
        'https://s3.wasabisys.com/sellou-images/1700-foto.webp%3FX-Amz-Algorithm%3DAWS4-HMAC-SHA256',
      ),
    ).resolves.toBe('1700-foto.webp');
  });

  it('restores an encoded space in a real filename', async () => {
    await expect(
      service.getFilenameFromUrl('https://s3.wasabisys.com/sellou-images/1700-WhatsApp%20Image.jpeg'),
    ).resolves.toBe('1700-WhatsApp Image.jpeg');
  });
});
