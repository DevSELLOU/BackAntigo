import { IsNumber, IsNotEmpty } from 'class-validator';

export class AssignManagerDto {
  @IsNumber()
  @IsNotEmpty()
  companyId: number;

  @IsNumber()
  @IsNotEmpty()
  subordinateId: number;

  @IsNumber()
  @IsNotEmpty()
  managerId: number;
}
