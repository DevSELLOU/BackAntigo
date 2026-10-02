import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TripStatus } from '../enums/trip-status.enum';

export class CompleteTripDto {
  @IsEnum(TripStatus)
  status: TripStatus;

  @IsOptional()
  @IsString()
  completionNote?: string;
}
