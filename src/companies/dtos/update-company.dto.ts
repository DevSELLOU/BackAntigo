import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { CompanyStatus } from '../enums/company-status.enum';
import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @ApiProperty({
    enum: CompanyStatus,
    default: CompanyStatus.Active,
  })
  @IsString()
  @IsEnum(CompanyStatus)
  status: CompanyStatus;
}
