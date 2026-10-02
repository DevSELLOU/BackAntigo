import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class SwitchCompanyDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'O campo companyId não pode estar vazio' })
  @IsNumber()
  companyId: number;
}
