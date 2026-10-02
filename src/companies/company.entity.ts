import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Category } from 'src/presentation/categories/category.entity';
import { Customer } from 'src/presentation/customers/customer.entity';
import { Order } from 'src/presentation/orders/order.entity';
import { PaymentCondition } from 'src/presentation/payment-conditions/payment-condition.entity';
import { Product } from 'src/presentation/products/entities/product.entity';
import { User } from 'src/users/user.entity';
import { CompanyStatus } from './enums/company-status.enum';

@Table
export class Company extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ allowNull: false })
  @IsNotEmpty({ message: 'O campo Razão Social não pode estar vazio' })
  @IsString()
  corporateName: string;

  @Column({ allowNull: false })
  @IsNotEmpty({ message: 'O campo Nome Fantasia não pode estar vazio' })
  @IsString()
  fantasyName: string;

  @Column({ allowNull: false })
  @IsNotEmpty({ message: 'O campo CNPJ não pode estar vazio' })
  @Matches(/^[0-9]{14}$/, { message: 'O CNPJ deve conter 14 dígitos' })
  @IsString()
  cnpj: string;

  @IsString()
  @Column({
    type: DataType.ENUM(...Object.values(CompanyStatus)),
    defaultValue: CompanyStatus.Active,
  })
  status: CompanyStatus;

  @Column
  @IsString()
  logoUrl?: string;

  @Column
  @IsString()
  customColor?: string;

  @Column
  @IsString()
  shopColor?: string;

  // TEXT, not the default VARCHAR(255): a presigned Wasabi URL is comfortably longer than 255
  // characters, and the mapper already drops an over-long `logoUrl` silently rather than failing.
  @Column({ type: DataType.TEXT })
  @IsString()
  coverUrl?: string;

  // Storefront identity — what the shop shows a buyer who arrives from a link and has no idea
  // whose catalogue this is.
  @Column({ type: DataType.TEXT })
  @IsString()
  about?: string;

  @Column
  @IsString()
  whatsapp?: string;

  @Column
  @IsString()
  phone?: string;

  @Column
  @IsString()
  address?: string;

  @Column
  @IsString()
  businessHours?: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  allowOrdersWithoutStock?: boolean;

  // - Relationships

  @HasMany(() => User)
  users?: User[];

  @HasMany(() => Customer)
  customers?: Customer[];

  @HasMany(() => Category)
  categories?: Category[];

  @HasMany(() => PaymentCondition)
  paymentConditions?: PaymentCondition[];

  @HasMany(() => Product)
  products?: Product[];

  @HasMany(() => Order)
  orders?: Order[];
}
