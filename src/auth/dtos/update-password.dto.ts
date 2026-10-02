import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../decorators/password.decorator';

export class UpdatePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo senha não pode estar vazio' })
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}
