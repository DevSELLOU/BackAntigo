import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { ExportsModule } from 'src/exports/exports.module';
import { PricingModule } from '../pricing/pricing.module';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { SubCategoriesProviders } from '../sub-categories/sub-categories.providers';
import { ProductsController } from './products.controller';
import { ProductsMapper } from './products.mapper';
import { ProductsProviders } from './products.providers';
import { ProductsService } from './products.service';
import { UploadsService } from 'src/uploads/uploads.service';

@Module({
  imports: [CompaniesModule, StockMovementModule, ExportsModule, PricingModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductsMapper,
    UploadsService,
    ...ProductsProviders,
    ...SubCategoriesProviders,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
