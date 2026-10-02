import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { CustomersModule } from 'src/presentation/customers/customers.module';
import { OrdersModule } from 'src/presentation/orders/orders.module';
import { UsersModule } from 'src/users/users.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [CompaniesModule, UsersModule, OrdersModule, CustomersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsdModule {}
