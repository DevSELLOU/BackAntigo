import { NotFoundException } from '@nestjs/common';
import { Model } from 'sequelize-typescript';
import { CompaniesService } from 'src/companies/companies.service';

type SequelizeModel<T> = {
  findOne(options?: any): Promise<T | null>;
  findAll(options?: any): Promise<T[]>;
  create(values?: any): Promise<T>;
};

export type Paginated<T> = { data: T[]; metadata: { total: number } };

export abstract class BaseCrudService<T extends Model> {
  constructor(
    protected repository: SequelizeModel<T>,
    protected companiesService: CompaniesService,
  ) {}

  protected async assertCompanyExists(companyId: number): Promise<void> {
    await this.companiesService.findOne(companyId);
  }

  protected async findOneOrFail(
    where: Record<string, any>,
    options?: { include?: any[]; message?: string },
  ): Promise<T> {
    const record = await this.repository.findOne({
      where,
      include: options?.include,
    });
    if (!record) {
      throw new NotFoundException(
        options?.message ?? 'Registro não encontrado',
      );
    }
    return record;
  }

  protected async list(
    where: Record<string, any>,
    include?: any[],
  ): Promise<Paginated<T>> {
    const data = await this.repository.findAll({ where, include });
    return { data, metadata: { total: data.length } };
  }
}
