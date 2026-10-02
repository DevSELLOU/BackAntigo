import { IsString } from 'class-validator';
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
import { User } from '../../users/user.entity';
import { Customer } from '../customers/customer.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { PaymentCondition } from '../payment-conditions/payment-condition.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock-movement/stock-movement.entity';
import { OrderStatus } from './enums/order-status.enum';
import { OrderResponsibleUser } from './order-responsible-user.entity';

@Table
export class Order extends Model {
  @Column
  observation?: string;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  amountPaid: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  discount: number;

  @IsString()
  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
  })
  status: OrderStatus;

  @Column
  returnReason?: string;

  @Column({ allowNull: true })
  cancelReason?: string;

  @Column({ allowNull: true })
  blockReason?: string;

  @Column({ type: DataType.BOOLEAN })
  isCustomerClientOrder: boolean;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  totalValue: number;

  @Column({ allowNull: true })
  purchaseOrderNumber?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  programmedDate?: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  statusHistory: {
    oldStatus: OrderStatus;
    newStatus: OrderStatus;
    userId: number;
    createdAt: Date;
  }[];

  // - Relations

  @ForeignKey(() => PaymentMethod)
  @Column
  paymentMethodId: number;

  @BelongsTo(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @ForeignKey(() => PaymentCondition)
  @Column
  paymentConditionId: number;

  @BelongsTo(() => PaymentCondition)
  paymentCondition: PaymentCondition;

  @ForeignKey(() => User)
  @Column
  responsibleUserId: number;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  responsibleUser: User;

  @ForeignKey(() => User)
  @Column({ allowNull: true })
  managerId?: number;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  manager: User;

  @ForeignKey(() => Customer)
  @Column
  customerId: number;

  @BelongsTo(() => Customer, { onDelete: 'CASCADE' })
  customer: Customer;

  @BelongsToMany(() => Product, () => OrderItem)
  products: Product[];

  @BelongsToMany(() => User, () => OrderResponsibleUser)
  responsibleUsers: User[];

  @HasMany(() => OrderItem)
  orderItems: OrderItem[];

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => StockMovement)
  stockMovements: StockMovement[];
}
