import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Customer } from '../customers/customer.entity';
import { PaymentCondition } from '../payment-conditions/payment-condition.entity';

@Table
export class CustomerPaymentCondition extends Model {
  @ForeignKey(() => Customer)
  @Column
  customerId: number;

  @ForeignKey(() => PaymentCondition)
  @Column
  paymentConditionId: number;
}
