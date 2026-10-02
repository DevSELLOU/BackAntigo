import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Product } from '../products/entities/product.entity';
import { SubCategory } from '../sub-categories/sub-category.entity';

@Table
export class ProductSubCategory extends Model {
  @ForeignKey(() => Product)
  @Column
  productId: number;

  @ForeignKey(() => SubCategory)
  @Column
  subCategoryId: number;
}
