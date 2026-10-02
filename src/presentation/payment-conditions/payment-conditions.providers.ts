import { PaymentCondition } from './payment-condition.entity';

export const PaymentConditionsProviders = [
  {
    provide: 'PAYMENT_CONDITION_REPOSITORY',
    useValue: PaymentCondition,
  },
];
