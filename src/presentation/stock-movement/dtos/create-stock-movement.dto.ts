import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { StockMovementType } from '../enums/stock-movement-type.enum';

export class CreateStockMovementDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({
    enum: StockMovementType,
  })
  @IsString()
  @IsEnum(StockMovementType)
  type: StockMovementType; // 'IN' for stock entry, 'OUT' for stock exit

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  productId: number;
}
