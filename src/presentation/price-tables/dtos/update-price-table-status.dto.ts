import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { PriceTableStatus } from '../enums/price-table-status.enum';

export class UpdatePriceTableStatusDto {
  @ApiProperty({
    enum: PriceTableStatus,
    default: PriceTableStatus.Active,
  })
  @IsString()
  @IsEnum(PriceTableStatus)
  status: PriceTableStatus;
}
