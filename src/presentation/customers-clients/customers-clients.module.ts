import { Module } from '@nestjs/common';
import { ExportsModule } from 'src/exports/exports.module';
import { UsersModule } from 'src/users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { CustomersClientsController } from './customers-clients.controller';
import { CustomersClientsService } from './customers-clients.service';

@Module({
  imports: [UsersModule, OrdersModule, ExportsModule],
  providers: [CustomersClientsService],
  controllers: [CustomersClientsController],
  exports: [CustomersClientsService],
})
export class CustomersClientsModule {}
