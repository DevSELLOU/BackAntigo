import {
  AutoIncrement,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../users/user.entity';
import { Company } from 'src/companies/company.entity';

@Table
export class UserHierarchy extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column({ allowNull: false })
  subordinateId: number;

  @BelongsTo(() => User, { foreignKey: 'subordinateId', onDelete: 'SET NULL' })
  subordinate: User;

  @ForeignKey(() => User)
  @Column({ allowNull: true })
  managerId: number;

  @BelongsTo(() => User, { foreignKey: 'managerId', onDelete: 'SET NULL' })
  manager: User;

  @BelongsTo(() => Company, 'companyId')
  company: Company;
}
