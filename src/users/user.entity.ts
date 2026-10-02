import * as bcrypt from 'bcrypt';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import {
  AutoIncrement,
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Customer } from 'src/presentation/customers/customer.entity';
import { Company } from '../companies/company.entity';
import { Order } from '../presentation/orders/order.entity';
import { UserCompany } from '../user-companies/user-company.entity';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';

@Table
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ allowNull: false })
  name: string;

  @IsNotEmpty({ message: 'O campo email não pode estar vazio' })
  @IsEmail({}, { message: 'Email no formato inválido' })
  @Column({ unique: true, allowNull: false })
  email: string;

  @IsNotEmpty({ message: 'O campo senha não pode estar vazio' })
  @IsString()
  @IsStrongPassword()
  @Column({ allowNull: false })
  password: string;

  @Column({ allowNull: true })
  password_reset_token: string;

  @Column({ allowNull: true })
  password_reset_expires: Date;

  @IsString()
  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    defaultValue: UserRole.Administrator,
  })
  role: UserRole;

  @IsString()
  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    defaultValue: UserStatus.Onboarding,
  })
  status: UserStatus;

  @IsNotEmpty({ message: 'O campo cargo não pode estar vazio' })
  @IsString()
  @Column({})
  position: string;

  @Column
  @IsString()
  phoneNumber?: string;

  @Column
  @IsString()
  profilePhoto?: string;

  @HasMany(() => Order)
  orders: Order[];

  @HasMany(() => UserCompany)
  userCompanies: UserCompany[];

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  standardCommissionPercentage: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ForeignKey(() => Customer)
  @Column
  customerId: number;

  @BelongsTo(() => Customer)
  customer: Customer;

  @BeforeCreate
  static async hashPassword(user: User) {
    user.password = await bcrypt.hash(user.password, 10);
  }
}
