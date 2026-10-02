import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { ExportsModule } from 'src/exports/exports.module';
import { CustomersClientsModule } from '../customers-clients/customers-clients.module';
import { CustomersModule } from '../customers/customers.module';
import { AccessRequestsController } from './access-requests.controller';
import { AccessRequestsMapper } from './access-requests.mapper';
import { AccessRequestsProviders } from './access-requests.providers';
import { AccessRequestsService } from './access-requests.service';

@Module({
  imports: [
    CustomersModule,
    CompaniesModule,
    ExportsModule,
    CustomersClientsModule,
  ],
  controllers: [AccessRequestsController],
  providers: [
    ...AccessRequestsProviders,
    AccessRequestsMapper,
    AccessRequestsService,
  ],
  exports: [AccessRequestsService],
})
export class AccessRequestsModule {}
