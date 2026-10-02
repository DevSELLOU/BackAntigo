import { UserCompany } from './user-company.entity';

export const userCompaniesProviders = [
  {
    provide: 'USER_COMPANY_REPOSITORY',
    useValue: UserCompany,
  },
];
