import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class AuthAccessRequestDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'O campo Nome Completo não pode estar vazio' })
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo Nome da Empresa não pode estar vazio' })
  @IsString()
  companyName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo Telefone não pode estar vazio' })
  @IsString()
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo CNPJ não pode estar vazio' })
  @Matches(/^[0-9]{14}$/, { message: 'O CNPJ deve conter 14 dígitos' })
  @IsString()
  cnpj: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo email não pode estar vazio' })
  @IsEmail({}, { message: 'Email no formato inválido' })
  email: string;
}
