import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  AutoIncrement,
  Table,
  BelongsTo,
} from 'sequelize-typescript';
import { Trip } from './trip.entity';
import { User } from 'src/users/user.entity';
import { Customer } from 'src/presentation/customers/customer.entity';
import { Company } from 'src/companies/company.entity';
import { VisitSource } from '../enums/visit-source.enum';

@Table
export class VisitRecord extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Trip)
  @Column
  tripId: number;

  @BelongsTo(() => Trip)
  trip: Trip;

  @ForeignKey(() => Customer)
  @Column
  customerId: number;

  @BelongsTo(() => Customer)
  customer: Customer;

  @Column({ type: DataType.DATE, allowNull: false })
  timestamp: Date;

  @Column({ type: DataType.DECIMAL(10, 8), allowNull: true })
  latitude: number;

  @Column({ type: DataType.DECIMAL(10, 8), allowNull: true })
  longitude: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  user: User;

  @Column({
    type: DataType.ENUM(...Object.values(VisitSource)),
    allowNull: true,
  })
  source: VisitSource;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isOutsideRoute: boolean;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  scheduledNextVisit: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;
}
