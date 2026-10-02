import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({
    type: 'number',
    format: 'decimal',
    example: 0.0,
    description: 'Discount amount for this specific item',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  discount?: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observation?: string;

  @ApiPropertyOptional({
    type: 'number',
    format: 'decimal',
    example: 0.0,
    description: 'Order-level general discount amount',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  discount?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  paymentMethodId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  paymentConditionId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @ApiProperty({
    type: 'boolean',
    example: false,
  })
  @IsBoolean()
  isBudget: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'date',
    description:
      'Date for programmed order in YYYY-MM-DD format (must be within minDays and maxDays from OrderSetup)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  programmedDate?: string;

  @ApiPropertyOptional({
    type: [Number],
    description:
      'IDs of additional responsible sellers for the order. The authenticated user is always the primary responsible seller.',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  responsibleUserIds?: number[];
}
