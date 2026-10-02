import { IsString } from 'class-validator';
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
import { Company } from 'src/companies/company.entity';
import { Customer } from '../customers/customer.entity';
import { AccessRequestStatus } from './enums/acess-request-status.enum';

@Table
export class AccessRequest extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  fullName: string;

  @Column
  companyName: string;

  @Column
  phoneNumber: string;

  @Column
  cnpj: string;

  @Column({ unique: true, allowNull: false })
  email: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => Customer)
  @Column
  customerId: number;

  @BelongsTo(() => Customer)
  customer: Customer;

  @IsString()
  @Column({
    type: DataType.ENUM(...Object.values(AccessRequestStatus)),
    defaultValue: AccessRequestStatus.Pending,
  })
  status: AccessRequestStatus;
}
