import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { ExportsModule } from 'src/exports/exports.module';
import { CategoriesController } from './categories.controller';
import { CategoriesMapper } from './categories.mapper';
import { CategoriesProviders } from './categories.providers';
import { CategoriesService } from './categories.service';

@Module({
  imports: [CompaniesModule, ExportsModule],
  providers: [CategoriesService, CategoriesMapper, ...CategoriesProviders],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
