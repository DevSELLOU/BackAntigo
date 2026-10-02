import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  IsNumber,
} from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { Type } from 'class-transformer';

export class PartialInvoicingItemDto {
  @ApiProperty()
  @IsNumber()
  productId: number;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    default: OrderStatus.InApproval,
  })
  @IsString()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({
    description:
      'Motivo de retorno do pedido. Apenas preencher se o status for "RETURNED"',
  })
  @IsString()
  @IsOptional()
  returnReason?: string;

  @ApiPropertyOptional({
    description:
      'Motivo de cancelamento do pedido. Apenas preencher se o status for "CANCELED"',
  })
  @IsString()
  @IsOptional()
  cancelReason?: string;

  @ApiPropertyOptional({
    description:
      'Motivo de bloqueio do pedido. Apenas preencher se o status for "BLOCKED"',
  })
  @IsString()
  @IsOptional()
  blockReason?: string;

  @ApiPropertyOptional({
    description: 'Produtos para faturamento parcial',
    type: [PartialInvoicingItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartialInvoicingItemDto)
  partialInvoicing?: PartialInvoicingItemDto[];
}
