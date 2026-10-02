import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { ExportsModule } from 'src/exports/exports.module';
import { PriceTableRule } from '../price-table-rules/price-table-rule.entity';
import { PriceTablesItemsProviders } from '../price-table-items/price-tables-items.providers';
import { ProductsModule } from '../products/products.module';
import { PricingModule } from '../pricing/pricing.module';
import { PriceTablesController } from './price-tables.controller';
import { PriceTablesMapper } from './price-tables.mapper';
import { PriceTablesProviders } from './price-tables.providers';
import { PriceTablesService } from './price-tables.service';

@Module({
  imports: [CompaniesModule, ProductsModule, ExportsModule, PricingModule],
  providers: [
    PriceTablesService,
    PriceTablesMapper,
    ...PriceTablesProviders,
    ...PriceTablesItemsProviders,
  ],
  controllers: [PriceTablesController],
  exports: [PriceTablesService],
})
export class PriceTablesModule {}
