import { DataTypes } from 'sequelize';
import {
  AutoIncrement,
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
import { StockMovementType } from './enums/stock-movement-type.enum';

@Table
export class StockMovement extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({
    type: DataTypes.INTEGER,
    allowNull: false,
  })
  quantity: number;

  @Column({
    type: DataType.ENUM(...Object.values(StockMovementType)),
  })
  type: StockMovementType; // 'IN' for stock entry, 'OUT' for stock exit

  @ForeignKey(() => Product)
  @Column
  productId: number;

  @BelongsTo(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @ForeignKey(() => Order)
  @Column({
    allowNull: true,
  })
  orderId: number;

  @BelongsTo(() => Order)
  order: Order;
}
