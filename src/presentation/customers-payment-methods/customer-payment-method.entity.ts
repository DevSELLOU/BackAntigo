import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Customer } from '../customers/customer.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';

@Table
export class CustomerPaymentMethod extends Model {
  @ForeignKey(() => Customer)
  @Column
  customerId: number;

  @ForeignKey(() => PaymentMethod)
  @Column
  paymentMethodId: number;
}
