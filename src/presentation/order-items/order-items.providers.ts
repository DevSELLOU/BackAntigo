import { OrderItem } from './order-item.entity';

export const OrderItemsProviders = [
  {
    provide: 'ORDER_ITEM_REPOSITORY',
    useValue: OrderItem,
  },
];
