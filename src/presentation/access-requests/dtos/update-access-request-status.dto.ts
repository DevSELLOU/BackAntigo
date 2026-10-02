import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { AccessRequestStatus } from '../enums/acess-request-status.enum';

export class UpdateAccessRequestStatusDto {
  @ApiProperty({
    enum: AccessRequestStatus,
    default: AccessRequestStatus.Realized,
  })
  @IsString()
  @IsEnum(AccessRequestStatus)
  status: AccessRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  customerId: number;
}
