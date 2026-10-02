import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { PriceTable } from '../price-tables/price-table.entity';

export enum RuleConditionOperator {
  Equals = 'EQUALS',
  Contains = 'CONTAINS',
  In = 'IN',
  GreaterThanOrEquals = 'GREATER_THAN_OR_EQUALS',
}

export enum AdjustmentType {
  PercentageDiscount = 'PERCENTAGE_DISCOUNT',
  PercentageMarkup = 'PERCENTAGE_MARKUP',
  FixedValue = 'FIXED_VALUE',
}

export interface RuleCondition {
  field: string;
  operator: RuleConditionOperator;
  value: string | number | string[];
}

@Table
export class PriceTableRule extends Model {
  @ForeignKey(() => PriceTable)
  @Column
  priceTableId: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  priority: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  conditions: RuleCondition[];

  @Column({
    type: DataType.ENUM(...Object.values(AdjustmentType)),
    allowNull: true,
  })
  adjustmentType: AdjustmentType;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  adjustmentValue: number;
}
