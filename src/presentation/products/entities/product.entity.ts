import { DataTypes } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BeforeSave,
  BelongsToMany,
  Column,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import sanitizeHtml from 'sanitize-html';
import { Company } from 'src/companies/company.entity';
import { PriceTableItem } from 'src/presentation/price-table-items/price-table-item.entity';
import { PriceTable } from 'src/presentation/price-tables/price-table.entity';
import { StockMovement } from 'src/presentation/stock-movement/stock-movement.entity';
import { OrderItem } from '../../order-items/order-item.entity';
import { Order } from '../../orders/order.entity';
import { ProductSubCategory } from '../../products-sub-categories/product-sub-category.entity';
import { SubCategory } from '../../sub-categories/sub-category.entity';
import { ProductPhoto } from './product-photo.entity';

@Table
export class Product extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column({ type: DataTypes.STRING(3000) })
  description: string;

  @Column({
    type: DataTypes.DECIMAL(10, 2),
  })
  price: number;

  @Column({
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  })
  minPrice: number;

  @Column({
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  })
  commissionPercentage: number;

  @Column({
    type: DataTypes.STRING(8),
    allowNull: true,
  })
  ncm: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: true,
  })
  colors: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: true,
  })
  brand: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: true,
  })
  unitOfMeasure: string;

  @Column({
    type: DataTypes.DECIMAL(12, 4),
    allowNull: true,
  })
  height: number;

  @Column({
    type: DataTypes.DECIMAL(12, 4),
    allowNull: true,
  })
  length: number;

  @Column({
    type: DataTypes.DECIMAL(12, 4),
    allowNull: true,
  })
  width: number;

  @Column({
    type: DataTypes.DECIMAL(12, 4),
    allowNull: true,
  })
  netWeight: number;

  @Column({
    type: DataTypes.DECIMAL(12, 4),
    allowNull: true,
  })
  thickness: number;

  @Column({
    type: DataTypes.STRING(3),
    allowNull: true,
  })
  heightUnit: string;

  @Column({
    type: DataTypes.STRING(3),
    allowNull: true,
  })
  lengthUnit: string;

  @Column({
    type: DataTypes.STRING(3),
    allowNull: true,
  })
  widthUnit: string;

  @Column({
    type: DataTypes.STRING(3),
    allowNull: true,
  })
  weightUnit: string;

  @Column({
    type: DataTypes.STRING(3),
    allowNull: true,
  })
  thicknessUnit: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: true,
  })
  reference: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: true,
  })
  model: string;

  // A public video link (YouTube, Vimeo or Google Drive), not an uploaded file: no storage cost,
  // no transcoding, and the same approach the training area will use later. TEXT because share
  // URLs carry long query strings. The front-end only ever builds an embed from an id it parsed
  // out of a known host, so a bad value here cannot become an arbitrary iframe src.
  @Column({
    type: DataTypes.TEXT,
    allowNull: true,
  })
  videoUrl: string;

  @Column
  stock: number;

  @Column({
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  })
  ipi: number;

  @Column({
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  })
  st: number;

  @Column({
    type: DataTypes.STRING,
    allowNull: true,
  })
  barcode: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: true,
  })
  manufacturer: string;

  @Column({
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  })
  icms: number;

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  active: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  favorite: boolean;

  @Column({
    type: DataTypes.STRING,
    allowNull: true,
  })
  clientCode: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: true,
  })
  supplierCode: string;

  // - Relations

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsToMany(() => SubCategory, () => ProductSubCategory)
  subCategories: SubCategory[];

  @BelongsToMany(() => Order, () => OrderItem)
  orders: Order[];

  @BelongsToMany(() => PriceTable, () => PriceTableItem)
  priceTables: PriceTable[];

  @HasMany(() => ProductPhoto)
  photos: ProductPhoto[];

  @HasMany(() => StockMovement)
  stockMovements: StockMovement[];

  @BeforeSave
  static sanitizeText(instance: Product) {
    if (instance.name) {
      const regex = /[^a-zA-Z0-9 áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/g;
      instance.name =
        instance.name.length > 255
          ? instance.name.substring(0, 255)
          : instance.name;
      instance.name = instance.name.replace(regex, '').trim();
    }
    if (instance.description) {
      const cleanDesc =
        instance.description.length > 3000
          ? instance.description.substring(0, 3000)
          : instance.description;
      instance.description = sanitizeHtml(cleanDesc, {
        allowedTags: [
          'p', 'br', 'b', 'i', 'u', 's', 'strong', 'em',
          'h2', 'h3', 'h4',
          'ul', 'ol', 'li',
          'span', 'div', 'sub', 'sup', 'pre', 'blockquote'
        ],
        allowedAttributes: {},
        disallowedTagsMode: 'discard'
      }).trim();
    }
  }
}
