import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PriceTableRuleConditionDto {
  @ApiProperty({ type: String })
  @IsString()
  field: string;

  @ApiProperty({ enum: ['EQUALS', 'CONTAINS', 'IN'] })
  @IsEnum(['EQUALS', 'CONTAINS', 'IN'])
  operator: 'EQUALS' | 'CONTAINS' | 'IN';

  @ApiProperty({ type: [String] })
  value: string | number | string[];
}

export class PriceTableRuleDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ type: [PriceTableRuleConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceTableRuleConditionDto)
  conditions?: PriceTableRuleConditionDto[];

  @ApiProperty({
    enum: ['PERCENTAGE_DISCOUNT', 'PERCENTAGE_MARKUP', 'FIXED_VALUE'],
  })
  @IsEnum(['PERCENTAGE_DISCOUNT', 'PERCENTAGE_MARKUP', 'FIXED_VALUE'])
  adjustmentType: 'PERCENTAGE_DISCOUNT' | 'PERCENTAGE_MARKUP' | 'FIXED_VALUE';

  @ApiProperty({ type: Number })
  @IsNumber()
  adjustmentValue: number;
}

export class CreatePriceTableRuleDto extends PriceTableRuleDto {}

export class ImportPriceTableDto {
  @ApiProperty({ type: String })
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'DRAFT'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'DRAFT'])
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';

  @ApiPropertyOptional({ type: [PriceTableRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceTableRuleDto)
  rules?: PriceTableRuleDto[];
}
