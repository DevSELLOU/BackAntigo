import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  BelongsToMany,
  Column,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Company } from 'src/companies/company.entity';
import { CustomerPaymentCondition } from '../customers-payment-conditions/customer-payment-condition.entity';
import { Customer } from '../customers/customer.entity';
import { Order } from '../orders/order.entity';

@Table
export class PaymentCondition extends Model {
  @Column
  @IsString()
  @IsNotEmpty()
  name: string;

  @Column
  @IsString()
  @IsOptional()
  description: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @HasMany(() => Order)
  orders: Order[];

  @BelongsToMany(() => Customer, () => CustomerPaymentCondition)
  customers: Customer[];
}
