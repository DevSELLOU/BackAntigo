import { forwardRef, Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { EmailsModule } from 'src/emails/emails.module';
import { ExportsModule } from 'src/exports/exports.module';
import { RoutesVisitsModule } from 'src/routes-visits/routes-visits.module';
import { UploadsModule } from 'src/uploads/uploads.module';
import { UsersModule } from 'src/users/users.module';
import { CustomersModule } from '../customers/customers.module';
import { OrderItemsProviders } from '../order-items/order-items.providers';
import { OrderSetupsProviders } from '../order-setups/order-setups.providers';
import { ProductsModule } from '../products/products.module';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { UserHierarchiesModule } from 'src/user-hierarchies/user-hierarchies.module';
import { UserGoalsModule } from 'src/user-goals/user-goals.module';
import { OrdersController } from './orders.controller';
import { OrdersMapper } from './orders.mapper';
import { OrdersProviders } from './orders.providers';
import { OrdersReportsService } from './orders-reports.service';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    CompaniesModule,
    CustomersModule,
    UsersModule,
    ProductsModule,
    StockMovementModule,
    EmailsModule,
    ProductsModule,
    UploadsModule,
    ExportsModule,
    forwardRef(() => RoutesVisitsModule),
    UserHierarchiesModule,
    UserGoalsModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersReportsService,
    OrdersMapper,
    ...OrdersProviders,
    ...OrderItemsProviders,
    ...OrderSetupsProviders,
  ],
  exports: [OrdersService, OrdersReportsService],
})
export class OrdersModule {}
