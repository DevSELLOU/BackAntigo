import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateOrderAmountPaidDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amountPaid: number;
}
