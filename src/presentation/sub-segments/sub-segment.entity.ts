import {
  BelongsTo,
  Column,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Customer } from '../customers/customer.entity';
import { Segment } from '../segments/segment.entity';

@Table
export class SubSegment extends Model {
  @Column
  name: string;

  @ForeignKey(() => Segment)
  @Column
  segmentId: number;

  @BelongsTo(() => Segment, { onDelete: 'CASCADE' })
  segment: Segment;

  @HasMany(() => Customer)
  customers: Customer[];
}
