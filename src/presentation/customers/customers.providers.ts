import { Customer } from './customer.entity';

export const CustomersProviders = [
  {
    provide: 'CUSTOMER_REPOSITORY',
    useValue: Customer,
  },
];
