import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { CompaniesService } from 'src/companies/companies.service';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { CreateOrderSetupDto } from './dtos/create-order-setup.dto';
import { UpdateOrderSetupDto } from './dtos/update-order-setup.dto';
import { OrderSetup } from './order-setup.entity';

@Injectable()
export class OrderSetupsService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject('ORDER_SETUP_REPOSITORY')
    private orderSetupsRepository: typeof OrderSetup,
  ) {}

  getModel() {
    return this.orderSetupsRepository;
  }

  async createOrderSetup(
    createOrderSetupDto: CreateOrderSetupDto,
    companyId: number,
  ): Promise<OrderSetup> {
    await this.companiesService.findOne(companyId);

    const orderSetup = await this.orderSetupsRepository.create({
      ...createOrderSetupDto,
      companyId,
    });

    return orderSetup;
  }

  async findOne(companyId: number, orderSetupId: number): Promise<OrderSetup> {
    await this.companiesService.findOne(companyId);

    const orderSetup = await this.orderSetupsRepository.findOne({
      where: { id: orderSetupId, companyId: companyId },
    });

    if (!orderSetup)
      throw new NotFoundException('Configuração de pedido não encontrada');

    return orderSetup;
  }

  async findAll(
    companyId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: OrderSetup[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      await this.companiesService.findOne(companyId);
      const { page = 1, limit = 10, sort, filters, query } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const filterQuery = buildFilterQuery(parsedFilters);
      const sortQuery = buildSortQuery(parsedSort);

      filterQuery.companyId = companyId;

      const total = await this.orderSetupsRepository.count({
        where: filterQuery,
      });

      const data = await this.orderSetupsRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
      });

      return {
        data,
        metadata: { page, limit, total },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Erro ao buscar: ${error.message}`,
      );
    }
  }

  async updateOrderSetup(
    companyId: number,
    orderSetupId: number,
    updateOrderSetupDto: UpdateOrderSetupDto,
  ): Promise<OrderSetup> {
    await this.companiesService.findOne(companyId);

    const orderSetup = await this.findOne(companyId, orderSetupId);

    await orderSetup.update(updateOrderSetupDto);
    await orderSetup.save();
    return orderSetup;
  }

  async deleteOrderSetup(
    companyId: number,
    orderSetupId: number,
  ): Promise<void> {
    await this.companiesService.findOne(companyId);

    const orderSetup = await this.findOne(companyId, orderSetupId);

    await orderSetup.destroy();
  }
}
