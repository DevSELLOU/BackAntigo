import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/user.entity';
import { Customer } from './customer.entity';

@Table({
  tableName: 'customer_sellers',
  indexes: [
    {
      unique: true,
      fields: ['customerId', 'userId'],
    },
  ],
})
export class CustomerSeller extends Model {
  @PrimaryKey
  @Column({ type: DataType.INTEGER, autoIncrement: true })
  id: number;

  @ForeignKey(() => Customer)
  @Column
  customerId: number;

  @BelongsTo(() => Customer, { onDelete: 'CASCADE' })
  customer: Customer;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User;
}
