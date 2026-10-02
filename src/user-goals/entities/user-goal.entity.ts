import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Company } from 'src/companies/company.entity';
import { Product } from 'src/presentation/products/entities/product.entity';
import { User } from 'src/users/user.entity';
import { UserGoalType } from '../enums/user-goal-type.enum';
import { UserGoalProduct } from './user-goal-product.entity';

@Table
export class UserGoal extends Model {
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  targetValue: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  currentValue: number;

  @Column({
    type: DataType.ENUM(...Object.values(UserGoalType)),
    allowNull: false,
  })
  type: UserGoalType;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  startDate?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  endDate?: string;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  user: User;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => UserGoalProduct)
  userGoalProducts: UserGoalProduct[];

  @BelongsToMany(() => Product, {
    through: () => UserGoalProduct,
    foreignKey: 'userGoalId',
    otherKey: 'productId',
  })
  products: Product[];
}
