import { Order } from './order.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { OrderSetup } from '../order-setups/order-setup.entity';

export const OrdersProviders = [
  {
    provide: 'ORDER_REPOSITORY',
    useValue: Order,
  },
  {
    provide: 'ORDER_ITEM_REPOSITORY',
    useValue: OrderItem,
  },
  {
    provide: 'ORDER_SETUP_REPOSITORY',
    useValue: OrderSetup,
  },
];
