import { IsNotEmpty, IsNumber } from 'class-validator';
import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Company } from 'src/companies/company.entity';

@Table
export class OrderSetup extends Model {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  @IsNotEmpty()
  @IsNumber()
  minDays: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  @IsNotEmpty()
  @IsNumber()
  maxDays: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;
}
