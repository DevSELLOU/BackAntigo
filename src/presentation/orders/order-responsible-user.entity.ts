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
import { Order } from './order.entity';

@Table({
  tableName: 'order_responsible_users',
  indexes: [
    {
      unique: true,
      fields: ['orderId', 'userId'],
    },
  ],
})
export class OrderResponsibleUser extends Model {
  @PrimaryKey
  @Column({ type: DataType.INTEGER, autoIncrement: true })
  id: number;

  @ForeignKey(() => Order)
  @Column
  orderId: number;

  @BelongsTo(() => Order, { onDelete: 'CASCADE' })
  order: Order;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User;
}
