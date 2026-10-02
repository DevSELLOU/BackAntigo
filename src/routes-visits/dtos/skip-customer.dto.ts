import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SkipCustomerDto {
  @IsNumber({}, { message: 'O ID do cliente deve ser um número' })
  customerId: number;

  @IsString()
  @IsNotEmpty({ message: 'A data da próxima visita é obrigatória' })
  scheduledNextVisit: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
