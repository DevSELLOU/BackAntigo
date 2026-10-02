import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

/** Janela padrão (em dias) usada para o agregado "comprou recentemente". */
export const DEFAULT_PURCHASE_WINDOW_DAYS = 45;

export class CustomerProductHistoryQueryDto {
  @ApiPropertyOptional({
    description:
      'Janela, em dias, para o agregado de quantidade comprada recentemente.',
    default: DEFAULT_PURCHASE_WINDOW_DAYS,
    example: 45,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3650)
  @Type(() => Number)
  windowDays?: number;

  @ApiPropertyOptional({
    description:
      'Pedido a ignorar no histórico. Usado ao editar um pedido, para que os itens dele não contem como compra anterior do próprio cliente.',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  excludeOrderId?: number;
}

export class CustomerProductHistoryItemDto {
  @ApiProperty({ description: 'Id do produto.' })
  productId: number;

  @ApiProperty({
    description: 'Data da última compra confirmada deste produto.',
    example: '2026-06-10',
  })
  lastPurchaseAt: string;

  @ApiProperty({ description: 'Quantidade comprada na última compra.' })
  lastPurchaseQuantity: number;

  @ApiProperty({
    description: 'Quantidade total comprada dentro da janela consultada.',
  })
  quantityInWindow: number;

  @ApiProperty({
    description: 'Quantidade total comprada em todo o histórico.',
  })
  totalQuantity: number;

  @ApiProperty({
    description: 'Quantidade de pedidos confirmados que contêm este produto.',
  })
  orderCount: number;
}

export class CustomerProductHistoryDto {
  @ApiProperty({ description: 'Janela, em dias, usada no agregado.' })
  windowDays: number;

  @ApiProperty({ type: [CustomerProductHistoryItemDto] })
  items: CustomerProductHistoryItemDto[];
}
