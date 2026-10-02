import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateOrderSetupDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  minDays: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  maxDays: number;
}
