import { PriceTableItem } from './price-table-item.entity';

export const PriceTablesItemsProviders = [
  {
    provide: 'PRICE_TABLE_ITEM_REPOSITORY',
    useValue: PriceTableItem,
  },
];
