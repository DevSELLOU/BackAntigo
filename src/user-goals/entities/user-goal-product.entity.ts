import {
  AutoIncrement,
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Product } from 'src/presentation/products/entities/product.entity';
import { UserGoal } from './user-goal.entity';

@Table
export class UserGoalProduct extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: 'DECIMAL(10, 2)', allowNull: false })
  totalToSell: number;

  @ForeignKey(() => UserGoal)
  @Column
  userGoalId: number;

  @BelongsTo(() => UserGoal)
  userGoal: UserGoal;

  @ForeignKey(() => Product)
  @Column
  productId: number;

  @BelongsTo(() => Product)
  product: Product;
}
