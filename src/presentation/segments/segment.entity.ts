import { IsString } from 'class-validator';
import {
  Column,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Company } from 'src/companies/company.entity';
import { SubSegment } from '../sub-segments/sub-segment.entity';

@Table
export class Segment extends Model {
  @Column
  @IsString()
  name: string;

  @Column
  description: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @HasMany(() => SubSegment)
  subSegments: SubSegment[];
}
