import { Module } from '@nestjs/common';
import { ExportsModule } from 'src/exports/exports.module';
import { UserCompaniesModule } from 'src/user-companies/user-companies.module';
import { UsersModule } from 'src/users/users.module';
import { CompaniesController } from './companies.controller';
import { CompaniesMapper } from './companies.mapper';
import { companiesProviders } from './companies.providers';
import { CompaniesService } from './companies.service';
import { UploadsService } from 'src/uploads/uploads.service';

@Module({
  imports: [UsersModule, ExportsModule, UserCompaniesModule],
  providers: [
    CompaniesService,
    CompaniesMapper,
    UploadsService,
    ...companiesProviders,
  ],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
