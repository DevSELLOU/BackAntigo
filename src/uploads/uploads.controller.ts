import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { logger } from 'src/utils/logger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreatePresignedUrlDto } from './dtos/create-presigned-url.dto';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@Controller('uploads')
@ApiBearerAuth()
@Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
export class UploadsController {
  constructor(
    @Inject(UploadsService)
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('presigned-url')
  @ApiBody({ type: CreatePresignedUrlDto })
  async createPresignedUrl(
    @Body()
    createPresignedUrlDto: CreatePresignedUrlDto,
  ) {
    logger.info(
      `[Uploads] Creating presigned URL for filename: ${createPresignedUrlDto.filename}, filetype: ${createPresignedUrlDto.filetype}`,
    );

    const presignedUrl = await this.uploadsService.createPresignedUrl(
      createPresignedUrlDto,
    );

    logger.info(`[Uploads] Presigned URL created successfully`);

    return {
      message: 'URL pré-assinada criada com sucesso',
      data: presignedUrl,
    };
  }
}
