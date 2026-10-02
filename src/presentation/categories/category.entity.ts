import { IsString } from 'class-validator';
import {
  Column,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Company } from 'src/companies/company.entity';
import { SubCategory } from '../sub-categories/sub-category.entity';

@Table
export class Category extends Model {
  @Column
  @IsString()
  name: string;

  @Column
  description: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @HasMany(() => SubCategory)
  subCategories: SubCategory[];
}
