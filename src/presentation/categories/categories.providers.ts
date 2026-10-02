import { Category } from './category.entity';

export const CategoriesProviders = [
  {
    provide: 'CATEGORY_REPOSITORY',
    useValue: Category,
  },
];
