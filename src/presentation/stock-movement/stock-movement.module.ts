import { Module } from '@nestjs/common';
import { Order } from '../orders/order.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock-movement/stock-movement.entity';
import { StockMovementService } from './stock-movement.service';

@Module({
  providers: [
    StockMovementService,
    {
      provide: 'STOCK_MOVEMENT_REPOSITORY',
      useValue: StockMovement,
    },
    {
      provide: 'PRODUCT_REPOSITORY',
      useValue: Product,
    },
    {
      provide: 'ORDER_REPOSITORY',
      useValue: Order,
    },
  ],
  exports: [StockMovementService, 'STOCK_MOVEMENT_REPOSITORY'],
})
export class StockMovementModule {}
