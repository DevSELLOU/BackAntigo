import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'O campo Razão Social não pode estar vazio' })
  @IsString()
  corporateName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo Nome Fantasia não pode estar vazio' })
  @IsString()
  fantasyName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo CNPJ não pode estar vazio' })
  @Matches(/^[0-9]{14}$/, { message: 'O CNPJ deve conter 14 dígitos' })
  @IsString()
  cnpj: string;
}
