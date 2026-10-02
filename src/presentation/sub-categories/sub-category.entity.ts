import {
  BelongsTo,
  BelongsToMany,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Category } from '../categories/category.entity';
import { ProductSubCategory } from '../products-sub-categories/product-sub-category.entity';
import { Product } from '../products/entities/product.entity';

@Table
export class SubCategory extends Model {
  @Column
  name: string;

  @ForeignKey(() => Category)
  @Column
  categoryId: number;

  @BelongsTo(() => Category, { onDelete: 'CASCADE' })
  category: Category;

  @BelongsToMany(() => Product, () => ProductSubCategory)
  products: Product[];
}
