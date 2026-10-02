import { BadRequestException } from '@nestjs/common';
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  AutoIncrement,
  Table,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Company } from 'src/companies/company.entity';
import { User } from 'src/users/user.entity';
import { Route } from './route.entity';
import { TripStatus } from '../enums/trip-status.enum';
import { VisitRecord } from './visit-record.entity';
import { ScheduledVisit } from './scheduled-visit.entity';

export interface CheckInContext {
  customerId: number;
  latitude?: number;
  longitude?: number;
  notes?: string;
  scheduledNextVisit?: string;
}

export interface CompleteContext {
  status: TripStatus;
  completionNote?: string;
}

@Table
export class Trip extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.ARRAY(DataType.INTEGER), allowNull: true })
  customerIds: number[];

  @Column({
    type: DataType.ENUM(...Object.values(TripStatus)),
    defaultValue: TripStatus.PENDING,
  })
  status: TripStatus;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  scheduledDate: string;

  @ForeignKey(() => Route)
  @Column({ allowNull: true })
  routeId: number;

  @BelongsTo(() => Route)
  route: Route;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  user: User;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Column({ type: DataType.TEXT, allowNull: true })
  completionNote: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  dailyLimit: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  overflow: boolean;

  @HasMany(() => VisitRecord)
  visitRecords: VisitRecord[];

  @HasMany(() => ScheduledVisit, { foreignKey: 'sourceTripId' })
  scheduledVisits: ScheduledVisit[];

  /* ─── Domain methods ─── */

  start(): void {
    if (this.status !== TripStatus.PENDING) {
      throw new BadRequestException('A viagem não está no status PENDING');
    }
    this.status = TripStatus.IN_PROGRESS;
  }

  assertInProgress(): void {
    if (this.status !== TripStatus.IN_PROGRESS) {
      throw new BadRequestException('A viagem precisa estar em andamento');
    }
  }

  complete(context: CompleteContext): void {
    if (
      this.status !== TripStatus.IN_PROGRESS &&
      this.status !== TripStatus.PENDING
    ) {
      throw new BadRequestException(
        'A viagem não pode ser finalizada no status atual',
      );
    }
    if (context.status === TripStatus.INCOMPLETE && !context.completionNote) {
      throw new BadRequestException(
        'Observação obrigatória para finalização incompleta',
      );
    }
    this.status = context.status;
    if (context.completionNote) {
      this.completionNote = context.completionNote;
    }
  }

  validateCustomerBelongs(customerId: number): void {
    if (!this.customerIds?.includes(customerId)) {
      throw new BadRequestException('Cliente não pertence a esta viagem');
    }
  }
}
