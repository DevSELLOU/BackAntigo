import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { AuthAccessRequestDto } from 'src/auth/dtos/auth-access-request.dto';
import { CompaniesService } from 'src/companies/companies.service';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { buildFullTextSearchWhere } from 'src/utils/fulltext-utils';
import { CustomersClientsService } from '../customers-clients/customers-clients.service';
import { Customer } from '../customers/customer.entity';
import { CustomersService } from '../customers/customers.service';
import { AccessRequest } from './access-request.entity';
import { AccessRequestsMapper } from './access-requests.mapper';
import { UpdateAccessRequestStatusDto } from './dtos/update-access-request-status.dto';
import { AccessRequestStatus } from './enums/acess-request-status.enum';

@Injectable()
export class AccessRequestsService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject('ACCESS_REQUEST_REPOSITORY')
    private accessRequestsRepository: typeof AccessRequest,
    @Inject(AccessRequestsMapper)
    private readonly accessRequestsMapper: AccessRequestsMapper,
    @Inject(CustomersClientsService)
    private readonly customersClientsService: CustomersClientsService,
  ) {}

  getModel(): typeof AccessRequest {
    return AccessRequest;
  }

  async createAccessRequest(
    companyId: number,
    accessRequestDto: AuthAccessRequestDto,
  ): Promise<AccessRequest> {
    const requestExists = await this.accessRequestsRepository.findOne({
      where: { email: accessRequestDto.email },
    });

    if (requestExists)
      throw new BadRequestException(
        'Solicitação de acesso já existe para este e-mail',
      );

    await this.companiesService.findOne(companyId);

    const customer = await this.customersService.findOneByDocument(
      accessRequestDto.cnpj,
    );

    const accessRequestMapped =
      await this.accessRequestsMapper.createAccessRequestDtoToAccessRequest(
        accessRequestDto,
        companyId,
        customer?.id ?? null,
      );

    const accessRequest = await this.accessRequestsRepository.create(
      accessRequestMapped.dataValues,
    );

    return accessRequest;
  }

  async findAll(
    companyId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: AccessRequest[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const company = await this.companiesService.findOne(companyId);
      const { page = 1, limit = 10, sort, filters, query } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const filterQuery = buildFilterQuery(parsedFilters);
      const sortQuery = buildSortQuery(parsedSort);

      if (query) {
        filterQuery[Op.or] = [
          buildFullTextSearchWhere(['fullName', 'companyName'], query),
          { email: { [Op.iLike]: `%${query}%` } },
          { cnpj: { [Op.iLike]: `%${query}%` } },
          Sequelize.where(
            Sequelize.cast(Sequelize.col('AccessRequest.id'), 'TEXT'),
            {
              [Op.iLike]: `%${query}%`,
            },
          ),
        ];
      }

      filterQuery.companyId = company.id;

      const total = await this.accessRequestsRepository.count({
        where: filterQuery,
      });

      const data = await this.accessRequestsRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
        include: [Customer],
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

  async updateStatus(
    companyId: number,
    id: number,
    updateAccessRequestStatusDto: UpdateAccessRequestStatusDto,
  ): Promise<AccessRequest> {
    await this.companiesService.findOne(companyId);
    const accessRequest = await this.accessRequestsRepository.findByPk(id);

    if (!accessRequest) {
      throw new BadRequestException('Solicitação de acesso não encontrada');
    }

    if (updateAccessRequestStatusDto.status === AccessRequestStatus.Realized) {
      if (
        !accessRequest.customerId &&
        !updateAccessRequestStatusDto.customerId
      ) {
        throw new BadRequestException(
          'Solicitação de acesso não possui cliente associado e não foi informado um cliente',
        );
      }

      await this.customersClientsService.createCustomerClient(
        accessRequest.companyId,
        accessRequest.customerId ?? updateAccessRequestStatusDto.customerId,
        {
          name: accessRequest.fullName,
          email: accessRequest.email,
        },
      );
    }

    accessRequest.status = updateAccessRequestStatusDto.status;

    await accessRequest.save();

    return accessRequest;
  }
}
