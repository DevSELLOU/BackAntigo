import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRouteDto {
  @IsNotEmpty({ message: 'O campo nome não pode estar vazio' })
  @IsString()
  name: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  customerIds?: number[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsArray()
  @IsNumber(
    {},
    { each: true, message: 'Os IDs dos usuários devem ser números' },
  )
  @IsOptional()
  userIds?: number[];

  @IsOptional()
  @IsBoolean()
  isFixed?: boolean;
}
