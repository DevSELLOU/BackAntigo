import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @IsNumber({}, { message: 'O ID do cliente deve ser um número' })
  customerId: number;

  @IsOptional()
  @IsNumber({}, { message: 'A latitude deve ser um número' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'A longitude deve ser um número' })
  longitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @IsNotEmpty({ message: 'A data da próxima visita é obrigatória' })
  scheduledNextVisit: string;
}
