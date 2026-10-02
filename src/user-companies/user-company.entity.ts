import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { UserCompanyStatus } from './enums/user-company-status.enum';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['userId', 'companyId'],
    },
  ],
})
export class UserCompany extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => User)
  @Column({ allowNull: false })
  userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ForeignKey(() => Company)
  @Column({ allowNull: false })
  companyId: number;

  @BelongsTo(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
  })
  role: UserRole;

  @Column({
    type: DataType.ENUM(...Object.values(UserCompanyStatus)),
    allowNull: false,
    defaultValue: UserCompanyStatus.ACTIVE,
  })
  status: UserCompanyStatus;

  @Column({ allowNull: true })
  position: string;
}
