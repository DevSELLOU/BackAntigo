import { SetMetadata } from '@nestjs/common';

export const CompanyOwnership = (required: boolean = true) =>
  SetMetadata('companyOwnership', required);
