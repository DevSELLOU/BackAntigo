import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export class UpdateUserDto extends OmitType(PartialType(CreateUserDto), [
  'email',
]) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUrl()
  profilePhoto?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'User role' })
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, description: 'User status' })
  @IsOptional()
  status?: UserStatus;
}
