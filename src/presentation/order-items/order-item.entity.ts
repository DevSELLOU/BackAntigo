import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Order } from '../orders/order.entity';
import { Product } from '../products/entities/product.entity';

@Table
export class OrderItem extends Model {
  @PrimaryKey
  @Column({ type: DataType.INTEGER, autoIncrement: true })
  id: number;

  @Column
  quantity: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  discount: number;

  @ForeignKey(() => Order)
  @Column
  orderId: number;

  @ForeignKey(() => Product)
  @Column
  productId: number;

  @BelongsTo(() => Product)
  product: Product;

  @BelongsTo(() => Order, { onDelete: 'CASCADE' })
  order: Order;
}
