import { Module } from '@nestjs/common';
import { PriceTable } from '../price-tables/price-table.entity';
import { PriceTableItem } from '../price-table-items/price-table-item.entity';
import { PriceTableRule } from '../price-table-rules/price-table-rule.entity';
import { Product } from '../products/entities/product.entity';
import { PricingService } from './pricing.service';
import { CommissionService } from './commission.service';
import { User } from '../../users/user.entity';

const PricingRepositoryProviders = [
  { provide: 'PRICE_TABLE_REPOSITORY', useValue: PriceTable },
  { provide: 'PRICE_TABLE_ITEM_REPOSITORY', useValue: PriceTableItem },
  { provide: 'PRICE_TABLE_RULE_REPOSITORY', useValue: PriceTableRule },
  { provide: 'PRODUCT_REPOSITORY', useValue: Product },
  { provide: 'USER_REPOSITORY', useValue: User },
];

@Module({
  providers: [PricingService, CommissionService, ...PricingRepositoryProviders],
  exports: [PricingService, CommissionService, ...PricingRepositoryProviders],
})
export class PricingModule {}
