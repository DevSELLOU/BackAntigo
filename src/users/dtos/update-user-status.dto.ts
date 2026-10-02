import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { UserStatus } from '../enums/user-status.enum';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatus,
    default: UserStatus.Active,
  })
  @IsString()
  @IsEnum(UserStatus)
  status: UserStatus;
}
