import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/enums/user-role.enum';
import { UserCompanyStatus } from '../enums/user-company-status.enum';

export class UpdateUserCompanyDto {
  @ApiPropertyOptional()
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional()
  @IsEnum(UserCompanyStatus)
  @IsOptional()
  status?: UserCompanyStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  position?: string;
}
