import { Product } from './entities/product.entity';

export const ProductsProviders = [
  {
    provide: 'PRODUCT_REPOSITORY',
    useValue: Product,
  },
];
