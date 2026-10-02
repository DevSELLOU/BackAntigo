import { OrderSetup } from './order-setup.entity';

export const OrderSetupsProviders = [
  {
    provide: 'ORDER_SETUP_REPOSITORY',
    useValue: OrderSetup,
  },
];
