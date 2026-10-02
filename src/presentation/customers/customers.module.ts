import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { ExportsModule } from 'src/exports/exports.module';
import { UsersModule } from 'src/users/users.module';
import { PaymentConditionsModule } from '../payment-conditions/payment-conditions.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { SubSegmentsProviders } from '../sub-segments/sub-segments.providers';
import { CustomersController } from './customers.controller';
import { CustomersMapper } from './customers.mapper';
import { CustomersProviders } from './customers.providers';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    CompaniesModule,
    PaymentConditionsModule,
    PaymentMethodsModule,
    ExportsModule,
    UsersModule,
  ],
  providers: [
    CustomersService,
    CustomersMapper,
    ...CustomersProviders,
    ...SubSegmentsProviders,
  ],
  controllers: [CustomersController],
  exports: [CustomersService],
})
export class CustomersModule {}
