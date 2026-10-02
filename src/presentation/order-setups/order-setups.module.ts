import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { ExportsModule } from 'src/exports/exports.module';
import { OrderSetupsController } from './order-setups.controller';
import { OrderSetupsProviders } from './order-setups.providers';
import { OrderSetupsService } from './order-setups.service';

@Module({
  imports: [CompaniesModule, ExportsModule],
  providers: [OrderSetupsService, ...OrderSetupsProviders],
  controllers: [OrderSetupsController],
  exports: [OrderSetupsService],
})
export class OrderSetupsModule {}
