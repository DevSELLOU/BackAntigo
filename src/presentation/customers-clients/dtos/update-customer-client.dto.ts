import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCustomerClientDto } from './create-customer-client.dto';

export class UpdateCustomerClientDto extends OmitType(
  PartialType(CreateCustomerClientDto),
  ['email'],
) {}
