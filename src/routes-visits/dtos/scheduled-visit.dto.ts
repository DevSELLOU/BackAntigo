import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateScheduledVisitDto {
  @IsNumber({}, { message: 'O ID do cliente deve ser um número' })
  customerId: number;

  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

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
