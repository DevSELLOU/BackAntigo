import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UserGoalType } from '../enums/user-goal-type.enum';

export class UserGoalProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  productId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalToSell: number;
}

export class CreateUserGoalDto {
  @ApiProperty({ enum: UserGoalType })
  @IsNotEmpty()
  @IsString()
  type: UserGoalType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  targetValue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  endDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @ApiPropertyOptional({ type: [UserGoalProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserGoalProductDto)
  @IsOptional()
  products?: UserGoalProductDto[];
}
