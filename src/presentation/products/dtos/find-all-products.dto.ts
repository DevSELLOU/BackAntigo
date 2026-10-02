import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';

export class FindAllProductsDto extends PartialType(BaseFindAllDataDto) {
  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  subCategoryIds?: number[];
}
