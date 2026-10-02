import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsNumber,
  IsString,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { UserGoalType } from '../enums/user-goal-type.enum';

export class UserGoalProductUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  productId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalToSell?: number;
}

export class UpdateUserGoalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @ApiPropertyOptional({ enum: UserGoalType })
  @IsOptional()
  @IsString()
  type?: UserGoalType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ type: [UserGoalProductUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserGoalProductUpdateDto)
  @IsOptional()
  products?: UserGoalProductUpdateDto[];
}
