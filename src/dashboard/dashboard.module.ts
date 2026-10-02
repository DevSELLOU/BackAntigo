import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { CustomersModule } from 'src/presentation/customers/customers.module';
import { OrdersModule } from 'src/presentation/orders/orders.module';
import { UsersModule } from 'src/users/users.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardFilterController } from './dashboard-filter.controller';
import { DashboardFilterService } from './dashboard-filter.service';
import { DashboardTablesController } from './dashboard-tables.controller';
import { DashboardTablesService } from './dashboard-tables.service';

@Module({
  imports: [CompaniesModule, UsersModule, OrdersModule, CustomersModule],
  controllers: [
    DashboardController,
    DashboardFilterController,
    DashboardTablesController,
  ],
  providers: [DashboardService, DashboardFilterService, DashboardTablesService],
  exports: [DashboardService, DashboardFilterService, DashboardTablesService],
})
export class DashboardModule {}
