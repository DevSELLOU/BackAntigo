import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { ExportsModule } from 'src/exports/exports.module';
import { PaymentConditionsController } from './payment-conditions.controller';
import { PaymentConditionsMapper } from './payment-conditions.mapper';
import { PaymentConditionsProviders } from './payment-conditions.providers';
import { PaymentConditionsService } from './payment-conditions.service';

@Module({
  imports: [CompaniesModule, ExportsModule],
  providers: [
    PaymentConditionsService,
    PaymentConditionsMapper,
    ...PaymentConditionsProviders,
  ],
  controllers: [PaymentConditionsController],
  exports: [PaymentConditionsService],
})
export class PaymentConditionsModule {}
