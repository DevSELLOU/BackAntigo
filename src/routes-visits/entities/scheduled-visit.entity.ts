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
import { Customer } from 'src/presentation/customers/customer.entity';
import { User } from 'src/users/user.entity';
import { Company } from 'src/companies/company.entity';
import { Trip } from './trip.entity';
import { VisitRecord } from './visit-record.entity';

export enum ScheduledVisitStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Table
export class ScheduledVisit extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Customer)
  @Column({ allowNull: false })
  customerId: number;

  @BelongsTo(() => Customer)
  customer: Customer;

  @ForeignKey(() => User)
  @Column({ allowNull: false })
  userId: number;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  user: User;

  @ForeignKey(() => Company)
  @Column({ allowNull: false })
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  scheduledDate: string;

  @Column({
    type: DataType.ENUM(...Object.values(ScheduledVisitStatus)),
    defaultValue: ScheduledVisitStatus.PENDING,
  })
  status: ScheduledVisitStatus;

  @ForeignKey(() => Trip)
  @Column({ allowNull: true })
  sourceTripId: number;

  @BelongsTo(() => Trip)
  sourceTrip: Trip;

  @ForeignKey(() => VisitRecord)
  @Column({ allowNull: true })
  sourceVisitRecordId: number;

  @BelongsTo(() => VisitRecord)
  sourceVisitRecord: VisitRecord;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;
}
