import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTripDto {
  @IsOptional()
  @IsNumber({}, { message: 'O ID da rota deve ser um número' })
  routeId: number;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsNumber({}, { message: 'O ID do usuário deve ser um número' })
  userId: number;

  @IsOptional()
  @IsNumber()
  dailyLimit?: number;
}
