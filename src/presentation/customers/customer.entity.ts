import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
} from 'class-validator';
import {
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Company } from 'src/companies/company.entity';
import { User } from 'src/users/user.entity';
import { CustomerPaymentCondition } from '../customers-payment-conditions/customer-payment-condition.entity';
import { CustomerPaymentMethod } from '../customers-payment-methods/customer-payment-method.entity';
import { Order } from '../orders/order.entity';
import { PaymentCondition } from '../payment-conditions/payment-condition.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { SubSegment } from '../sub-segments/sub-segment.entity';
import { CustomerSeller } from './customer-seller.entity';
import { CustomerTaxRegime } from './enums/customer-tax-regime.enum';
import { CustomerStatus } from './enums/customer-status.enum';
import { CustomerType } from './enums/customer-type.enum';

@Table
export class Customer extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ allowNull: false })
  @IsNotEmpty({ message: 'O campo Razão Social não pode estar vazio' })
  @IsString()
  corporateName: string;

  @Column
  @IsNotEmpty({ message: 'O campo Nome Fantasia não pode estar vazio' })
  @IsString()
  fantasyName: string;

  @Column
  @IsNotEmpty({ message: 'O campo CPF/CNPJ não pode estar vazio' })
  @IsString()
  document: string;

  @Column({ type: DataType.DECIMAL, defaultValue: 0 })
  @IsNotEmpty({ message: 'O campo Limite de Crédito não pode estar vazio' })
  @IsNumber()
  creditLimit: number;

  @Column({ type: DataType.DECIMAL, defaultValue: 0 })
  @IsNumber()
  creditLimitUsed: number;

  @Column
  @Matches(/^[0-9]{9}$/, {
    message: 'A Inscrição Estadual deve conter 9 dígitos',
  })
  @IsString()
  stateRegistration?: string;

  @Column({ allowNull: true })
  @Matches(/^[0-9]{13}$/, {
    message: 'O GLN deve conter 13 dígitos',
  })
  @IsString()
  gln?: string;

  @Column
  @IsNotEmpty({ message: 'O campo CEP não pode estar vazio' })
  @IsString()
  cep: string;

  @Column
  @IsNotEmpty({ message: 'O campo Endereço não pode estar vazio' })
  @IsString()
  address: string;

  @Column
  @IsNotEmpty({ message: 'O campo Cidade não pode estar vazio' })
  @IsString()
  city: string;

  @Column
  @IsNotEmpty({ message: 'O UF não pode estar vazio' })
  @IsString()
  UF: string;

  @Column
  @IsNotEmpty({ message: 'O campo Bairro não pode estar vazio' })
  @IsString()
  neighborhood: string;

  @Column({ allowNull: false })
  @IsNotEmpty({ message: 'O campo Telefone não pode estar vazio' })
  @IsString()
  phoneNumber: string;

  @Column
  @IsString()
  companyPhone?: string;

  @Column
  @IsNotEmpty({ message: 'O campo email não pode estar vazio' })
  @IsEmail({}, { message: 'Email no formato inválido' })
  email: string;

  @Column
  @IsString()
  url?: string;

  @Column
  @IsString()
  youtubeUrl?: string;

  @Column
  @IsString()
  observations?: string;

  @Column
  @IsString()
  logoUrl?: string;

  @Column
  @IsString()
  segment?: string;

  @IsString()
  @Column({
    type: DataType.ENUM(...Object.values(CustomerTaxRegime)),
  })
  taxRegime?: CustomerTaxRegime;

  @Column
  @IsBoolean()
  taxWithholding?: boolean;

  @Column
  @IsString()
  operationNature?: string;

  @Column
  @IsString()
  bank?: string;

  @Column
  @IsString()
  agency?: string;

  @Column
  @IsString()
  account?: string;

  @Column
  @IsString()
  accountType?: string;

  @Column
  @IsString()
  invoiceEmail?: string;

  @Column
  @IsString()
  orderEmail?: string;

  @Column
  @IsString()
  billingEmail?: string;

  @Column
  @IsString()
  customerGroupCode?: string;

  @IsString()
  @Column({
    type: DataType.ENUM(...Object.values(CustomerStatus)),
    defaultValue: CustomerStatus.Active,
  })
  status?: CustomerStatus;

  @IsString()
  @Column({
    type: DataType.ENUM(...Object.values(CustomerType)),
    allowNull: true,
  })
  customerType?: CustomerType;

  @Column({ type: DataType.JSONB, allowNull: true })
  tags?: string[];

  @Column({ allowNull: true })
  @IsString()
  primaryContactName?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  emails?: string[];

  @Column({ type: DataType.JSONB, allowNull: true })
  phones?: string[];

  @Column({ type: DataType.JSONB, allowNull: true })
  billingAddress?: {
    postalCode: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    number: string;
    complement?: string;
  };

  @Column({ type: DataType.JSONB, allowNull: true })
  shippingAddress?: {
    postalCode: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    number: string;
    complement?: string;
  };

  // - Relations

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @HasMany(() => Order)
  orders: Order[];

  @ForeignKey(() => SubSegment)
  @Column
  subSegmentId: number;

  @BelongsTo(() => SubSegment)
  subSegment: SubSegment;

  @BelongsToMany(() => PaymentCondition, () => CustomerPaymentCondition)
  paymentConditions: PaymentCondition[];

  @BelongsToMany(() => PaymentMethod, () => CustomerPaymentMethod)
  paymentMethods: PaymentMethod[];

  @BelongsToMany(() => User, () => CustomerSeller)
  sellers: User[];

  @Column({ type: DataType.DATEONLY, allowNull: true })
  lastPurchaseDate: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  dailyVisitLimitOverride: number;

  @HasMany(() => User)
  customerClients: User[];
}
