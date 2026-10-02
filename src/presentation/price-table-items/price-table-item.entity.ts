import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Transform } from 'class-transformer';
import { PriceTable } from '../price-tables/price-table.entity';
import { Product } from '../products/entities/product.entity';
import { formatPrice } from 'src/utils/parse-number.util';

@Table
export class PriceTableItem extends Model {
  @ForeignKey(() => PriceTable)
  @Column
  priceTableId: number;

  @BelongsTo(() => PriceTable)
  priceTable: PriceTable;

  @ForeignKey(() => Product)
  @Column
  productId: number;

  @BelongsTo(() => Product)
  product: Product;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  @Transform(({ value }) => formatPrice(value as number | null), {
    toPlainOnly: true,
  })
  manualPrice: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isManual: boolean;
}
