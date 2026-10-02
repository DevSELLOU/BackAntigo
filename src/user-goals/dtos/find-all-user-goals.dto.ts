import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';

export class FindAllUserGoalsDto extends BaseFindAllDataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  userId?: number;
}
