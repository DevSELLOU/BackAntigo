import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '../../users/enums/user-role.enum';

export class AddUserToCompanyDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'O campo email não pode estar vazio' })
  @IsEmail({}, { message: 'Email no formato inválido' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo cargo não pode estar vazio' })
  @IsEnum(UserRole, { message: 'Role inválida' })
  role: UserRole;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  position?: string;
}
