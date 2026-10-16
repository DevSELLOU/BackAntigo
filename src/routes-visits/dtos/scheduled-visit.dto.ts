import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Matches,
} from 'class-validator';

export class CreateScheduledVisitDto {
  @IsInt()
  @Min(1)
  customerId: number;

  @IsInt()
  @Min(1)
  userId: number;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsNotEmpty()
  scheduledDate: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  scheduledTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateScheduledVisitDto {
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduledVisitDayQuery {
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}
