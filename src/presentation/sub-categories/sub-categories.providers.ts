import { SubCategory } from './sub-category.entity';

export const SubCategoriesProviders = [
  {
    provide: 'SUB_CATEGORY_REPOSITORY',
    useValue: SubCategory,
  },
];
