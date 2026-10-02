import { Company } from './company.entity';

export const companiesProviders = [
  {
    provide: 'COMPANY_REPOSITORY',
    useValue: Company,
  },
];
