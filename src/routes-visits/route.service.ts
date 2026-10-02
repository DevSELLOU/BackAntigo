import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CompaniesService } from 'src/companies/companies.service';
import { CustomersService } from 'src/presentation/customers/customers.service';
import { Route } from './entities/route.entity';
import { BaseCrudService, Paginated } from './base-crud.service';
import { CreateRouteDto } from './dtos/create-route.dto';
import { Op } from 'sequelize';
import { User } from 'src/users/user.entity';

@Injectable()
export class RouteService extends BaseCrudService<Route> {
  constructor(
    @Inject('ROUTE_REPOSITORY')
    repository: typeof Route,
    @Inject(CompaniesService)
    companiesService: CompaniesService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
  ) {
    super(repository, companiesService);
  }

  private async validateRouteCustomers(
    companyId: number,
    customerIds: number[],
  ): Promise<void> {
    const unique = new Set(customerIds);
    if (unique.size !== customerIds.length) {
      throw new BadRequestException('IDs de clientes duplicados encontrados');
    }

    await Promise.all(
      customerIds.map(async (id) => {
        try {
          await this.customersService.findOne(companyId, id);
        } catch {
          throw new BadRequestException(`Cliente com ID ${id} não encontrado`);
        }
      }),
    );
  }

  async create(
    companyId: number,
    dto: CreateRouteDto,
    userId: number,
  ): Promise<Route> {
    await this.assertCompanyExists(companyId);

    if (dto.customerIds?.length) {
      await this.validateRouteCustomers(companyId, dto.customerIds);
    }

    return this.repository.create({
      name: dto.name,
      customerIds: dto.customerIds || [],
      description: dto.description,
      scheduledDate: dto.scheduledDate,
      userIds: dto.userIds,
      companyId,
      isFixed: dto.isFixed || false,
      createdById: userId,
    });
  }

  async repeat(
    companyId: number,
    routeId: number,
    scheduledDate: string,
  ): Promise<Route> {
    await this.assertCompanyExists(companyId);

    const original = await this.findOneOrFail(
      { id: routeId, companyId },
      { message: 'Rota não encontrada' },
    );

    return this.repository.create({
      name: original.name,
      customerIds: original.customerIds,
      description: original.description,
      scheduledDate,
      userIds: original.userIds,
      companyId,
      isFixed: false,
      createdById: original.createdById,
    });
  }

  async findAll(companyId: number): Promise<Paginated<Route>> {
    await this.assertCompanyExists(companyId);
    return this.list({ companyId }, [
      { model: User, as: 'createdBy', attributes: ['id', 'name'] },
    ]);
  }

  async findMy(companyId: number, userId: number): Promise<Paginated<Route>> {
    await this.assertCompanyExists(companyId);
    const data = await this.repository.findAll({
      where: {
        companyId,
        [Op.or]: [
          { userIds: { [Op.contains]: [userId] } },
          { createdById: userId },
        ],
      },
    });
    return { data, metadata: { total: data.length } };
  }

  async findOne(companyId: number, id: number): Promise<Route> {
    await this.assertCompanyExists(companyId);
    return this.findOneOrFail(
      { id, companyId },
      { message: 'Rota não encontrada' },
    );
  }

  async update(
    companyId: number,
    id: number,
    dto: CreateRouteDto,
  ): Promise<Route> {
    await this.assertCompanyExists(companyId);

    const route = await this.findOneOrFail(
      { id, companyId },
      { message: 'Rota não encontrada' },
    );

    if (dto.customerIds?.length) {
      await this.validateRouteCustomers(companyId, dto.customerIds);
    }

    if (dto.name) route.name = dto.name;
    if (dto.description !== undefined) route.description = dto.description;
    if (dto.customerIds) route.customerIds = dto.customerIds;
    if (dto.scheduledDate !== undefined)
      route.scheduledDate = dto.scheduledDate;
    if (dto.userIds !== undefined) route.userIds = dto.userIds;

    await route.save();
    return route;
  }

  async remove(companyId: number, id: number): Promise<{ message: string }> {
    await this.assertCompanyExists(companyId);

    const route = await this.findOneOrFail(
      { id, companyId },
      { message: 'Rota não encontrada' },
    );
    await route.destroy();

    return { message: 'Rota excluída com sucesso' };
  }
}
