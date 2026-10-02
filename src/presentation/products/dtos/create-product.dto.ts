import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
  IsInstance,
} from 'class-validator';

class CreateProductPhotoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Nome do produto',
    example: 'Produto de alta qualidade',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'Produto de alta qualidade',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(3000)
  description: string;

  @ApiProperty({
    description: 'Preço do produto',
    example: 100.5,
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{8}$/, {
    message: 'NCM tem que ter 8 dígitos',
  })
  ncm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colors?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitOfMeasure?: string;

  @ApiPropertyOptional({
    description:
      'Altura no formato brasileiro (ex: 1,85 para metros ou 185 para cm)',
    example: '1,85',
  })
  @IsOptional()
  @IsString()
  height?: string;

  @ApiPropertyOptional({
    description: 'Comprimento no formato brasileiro',
    example: '2,50',
  })
  @IsOptional()
  @IsString()
  length?: string;

  @ApiPropertyOptional({
    description: 'Largura no formato brasileiro',
    example: '0,50',
  })
  @IsOptional()
  @IsString()
  width?: string;

  @ApiPropertyOptional({
    description: 'Peso líquido no formato brasileiro (ex: 1,500 para kg)',
    example: '1,500',
  })
  @IsOptional()
  @IsString()
  netWeight?: string;

  @ApiPropertyOptional({
    description: 'Espessura no formato brasileiro',
    example: '0,25',
  })
  @IsOptional()
  @IsString()
  thickness?: string;

  @ApiPropertyOptional({
    description: 'Unidade de medida para altura (mm, cm, m)',
    example: 'm',
  })
  @IsOptional()
  @IsString()
  heightUnit?: string;

  @ApiPropertyOptional({
    description: 'Unidade de medida para comprimento (mm, cm, m)',
    example: 'm',
  })
  @IsOptional()
  @IsString()
  lengthUnit?: string;

  @ApiPropertyOptional({
    description: 'Unidade de medida para largura (mm, cm, m)',
    example: 'm',
  })
  @IsOptional()
  @IsString()
  widthUnit?: string;

  @ApiPropertyOptional({
    description: 'Unidade de medida para peso (g, kg)',
    example: 'kg',
  })
  @IsOptional()
  @IsString()
  weightUnit?: string;

  @ApiPropertyOptional({
    description: 'Unidade de medida para espessura (mm, cm, m)',
    example: 'cm',
  })
  @IsOptional()
  @IsString()
  thicknessUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Link público de vídeo (YouTube, Vimeo ou Google Drive)',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({
    description: 'Valor do IPI (imposto de produtos industrializados)',
    example: 3.7,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  ipi: number;

  @ApiProperty({
    description: 'Valor do ST (substituição tributária)',
    example: 1.5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  st: number;

  @ApiProperty({
    description: 'Código de barras (EAN-13 Unidade - DUN-14 Caixa)',
    example: '7891234567890',
  })
  @IsNotEmpty()
  @IsString()
  barcode: string;

  @ApiProperty({
    description: 'Fabricante/fornecedor',
    example: 'Apple',
  })
  @IsNotEmpty()
  @IsString()
  manufacturer: string;

  @ApiProperty({
    description:
      'Valor do ICMS (Alíquota - Imposto sobre Circulação de Mercadoria e Serviço)',
    example: 18,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  icms: number;

  @ApiPropertyOptional({
    description: 'Indica se o produto é favorito',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @ApiPropertyOptional({
    description: 'Indica se o produto está ativo',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  subCategoryIds?: number[];

  @ApiPropertyOptional({ type: [CreateProductPhotoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductPhotoDto)
  photos?: CreateProductPhotoDto[];
}
