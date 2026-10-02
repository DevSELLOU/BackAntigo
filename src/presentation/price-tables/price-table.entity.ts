import {
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { PriceTableItem } from '../price-table-items/price-table-item.entity';
import { PriceTableRule } from '../price-table-rules/price-table-rule.entity';
import { PriceTableStatus } from './enums/price-table-status.enum';
import { AdjustmentType } from '../price-table-rules/price-table-rule.entity';
import { Company } from 'src/companies/company.entity';

@Table
export class PriceTable extends Model {
  @Column
  name: string;

  @Column
  description: string;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  price: number;

  @Column({
    type: DataType.ENUM(...Object.values(AdjustmentType)),
    allowNull: true,
  })
  adjustmentType: AdjustmentType;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  adjustmentValue: number;

  @Column({
    type: DataType.ENUM(...Object.values(PriceTableStatus)),
    defaultValue: PriceTableStatus.Active,
  })
  status: PriceTableStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  startDate: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  endDate: Date;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @HasMany(() => PriceTableItem)
  items: PriceTableItem[];

  @HasMany(() => PriceTableRule)
  rules: PriceTableRule[];
}
