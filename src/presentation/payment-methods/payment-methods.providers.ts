import { PaymentMethod } from './payment-method.entity';

export const PaymentMethodsProviders = [
  {
    provide: 'PAYMENT_METHOD_REPOSITORY',
    useValue: PaymentMethod,
  },
];
