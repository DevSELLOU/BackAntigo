import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { ExportsModule } from 'src/exports/exports.module';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsMapper } from './payment-methods.mapper';
import { PaymentMethodsProviders } from './payment-methods.providers';
import { PaymentMethodsService } from './payment-methods.service';

@Module({
  imports: [CompaniesModule, ExportsModule],
  providers: [
    PaymentMethodsService,
    PaymentMethodsMapper,
    ...PaymentMethodsProviders,
  ],
  controllers: [PaymentMethodsController],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
