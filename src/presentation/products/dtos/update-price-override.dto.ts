import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePriceOverrideDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  manualPrice: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  priceTableId?: number;
}
