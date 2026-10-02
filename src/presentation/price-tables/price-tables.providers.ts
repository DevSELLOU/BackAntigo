import { PriceTable } from './price-table.entity';

export const PriceTablesProviders = [
  {
    provide: 'PRICE_TABLE_REPOSITORY',
    useValue: PriceTable,
  },
];
