import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { CategoriesModule } from '../categories/categories.module';
import { SubCategoriesController } from './sub-categories.controller';
import { SubCategoriesMapper } from './sub-categories.mapper';
import { SubCategoriesProviders } from './sub-categories.providers';
import { SubCategoriesService } from './sub-categories.service';

@Module({
  imports: [CategoriesModule, CompaniesModule],
  providers: [
    SubCategoriesService,
    SubCategoriesMapper,
    ...SubCategoriesProviders,
  ],
  controllers: [SubCategoriesController],
  exports: [SubCategoriesService, ...SubCategoriesProviders],
})
export class SubCategoryModule {}
