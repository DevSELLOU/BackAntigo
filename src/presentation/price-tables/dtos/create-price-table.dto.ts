import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';

export class RuleConditionDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty({ enum: ['EQUALS', 'CONTAINS', 'IN', 'GREATER_THAN_OR_EQUALS'] })
  @IsString()
  operator: 'EQUALS' | 'CONTAINS' | 'IN' | 'GREATER_THAN_OR_EQUALS';

  @ApiProperty({
    description: 'String for EQUALS/CONTAINS, array of strings for IN operator',
  })
  @IsOptional()
  value?: string | string[];
}

export class CreatePriceTableRuleDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ type: [RuleConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions?: RuleConditionDto[];

  @ApiPropertyOptional({
    enum: ['PERCENTAGE_DISCOUNT', 'PERCENTAGE_MARKUP', 'FIXED_VALUE'],
  })
  @IsOptional()
  @IsEnum(['PERCENTAGE_DISCOUNT', 'PERCENTAGE_MARKUP', 'FIXED_VALUE'])
  adjustmentType?: 'PERCENTAGE_DISCOUNT' | 'PERCENTAGE_MARKUP' | 'FIXED_VALUE';

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  adjustmentValue?: number;
}

export class CreatePriceTableDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    enum: ['PERCENTAGE_DISCOUNT', 'PERCENTAGE_MARKUP', 'FIXED_VALUE'],
  })
  @IsOptional()
  @IsEnum(['PERCENTAGE_DISCOUNT', 'PERCENTAGE_MARKUP', 'FIXED_VALUE'])
  adjustmentType?: 'PERCENTAGE_DISCOUNT' | 'PERCENTAGE_MARKUP' | 'FIXED_VALUE';

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  adjustmentValue?: number;

  @ApiPropertyOptional({ type: [CreatePriceTableRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceTableRuleDto)
  rules?: CreatePriceTableRuleDto[];
}
