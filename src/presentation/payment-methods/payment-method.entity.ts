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
import { CustomerPaymentMethod } from '../customers-payment-methods/customer-payment-method.entity';
import { Customer } from '../customers/customer.entity';
import { Order } from '../orders/order.entity';

@Table
export class PaymentMethod extends Model {
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

  @BelongsToMany(() => Customer, () => CustomerPaymentMethod)
  customers: Customer[];
}
