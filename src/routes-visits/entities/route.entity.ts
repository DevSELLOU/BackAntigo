import { IsNotEmpty, IsString } from 'class-validator';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  AutoIncrement,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/user.entity';

@Table
export class Route extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @IsNotEmpty({ message: 'O campo nome não pode estar vazio' })
  @IsString()
  @Column({ allowNull: false })
  name: string;

  @Column({ type: DataType.ARRAY(DataType.INTEGER), allowNull: true })
  customerIds: number[];

  @Column
  @IsString()
  description: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  scheduledDate: string;

  @Column({ type: DataType.ARRAY(DataType.INTEGER), allowNull: true })
  userIds: number[];

  @Column
  companyId: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isFixed: boolean;

  @ForeignKey(() => User)
  @Column
  createdById: number;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  createdBy: User;

  static readonly MODEL_NAME = 'Route' as const;
}
