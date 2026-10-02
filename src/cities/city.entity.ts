import {
  AutoIncrement,
  Column,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['name', 'stateAbbreviation'],
    },
  ],
})
export class City extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ allowNull: false })
  name: string;

  @Column({ allowNull: false })
  stateAbbreviation: string;

  @Column({ allowNull: false })
  stateName: string;

  @Column({ allowNull: false, unique: true })
  ibgeCode: string;

  @Column({ allowNull: true })
  latitude?: string;

  @Column({ allowNull: true })
  longitude?: string;
}
