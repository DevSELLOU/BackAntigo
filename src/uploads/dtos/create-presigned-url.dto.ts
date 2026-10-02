import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches, MaxLength } from 'class-validator';
import { FileContentType } from '../enums/file-content-type.enum';

export class CreatePresignedUrlDto {
  @ApiProperty({
    description: 'Nome do arquivo, incluindo a extensão.',
    example: 'documento.pdf',
  })
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'filename must contain only alphanumeric characters, dots, hyphens, or underscores',
  })
  filename: string;

  @ApiProperty({
    description: `Tipo do conteúdo do arquivo, deve ser um dos valores permitidos:
    - \`Png\`: Arquivo no formato PNG (\`image/png\`).
    - \`Jpg\`: Arquivo no formato JPEG (\`image/jpeg\`).`,
    example: FileContentType.Png,
    enum: FileContentType,
  })
  @IsEnum(FileContentType)
  filetype: FileContentType;
}
