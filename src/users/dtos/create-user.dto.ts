import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  [x: string]: any;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo email não pode estar vazio' })
  @IsEmail({}, { message: 'Email no formato inválido' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo cargo não pode estar vazio' })
  @IsString()
  position: string;

  @ApiPropertyOptional({
    description: 'Telefone do usuário',
    example: '11999998888',
  })
  @IsString()
  @IsOptional()
  phoneNumber: string;
}
