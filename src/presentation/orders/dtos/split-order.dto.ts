import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SplitOrderItemDto {
  @ApiProperty()
  @IsNumber()
  productId: number;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class SplitOrderDto {
  @ApiProperty({
    description:
      'Lista de produtos e quantidades que devem permanecer no pedido original',
    type: [SplitOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitOrderItemDto)
  items: SplitOrderItemDto[];
}
