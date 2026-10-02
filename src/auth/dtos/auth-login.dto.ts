import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class AuthLoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Email no formato inválido' })
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  password: string;

  @ApiPropertyOptional({
    description:
      'ID da empresa ativa. Se não informado, usa a primeira empresa ativa do usuário.',
  })
  @IsNumber()
  @IsOptional()
  companyId?: number;
}
