import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { CompaniesService } from 'src/companies/companies.service';
import { AuthenticatedUserDto } from 'src/auth/dtos/authenticated-user.dto';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { buildFullTextSearchWhere } from 'src/utils/fulltext-utils';
import { logger } from 'src/utils/logger';
import { UserRole } from 'src/users/enums/user-role.enum';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { PaymentCondition } from '../payment-conditions/payment-condition.entity';
import { PaymentConditionsService } from '../payment-conditions/payment-conditions.service';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { Customer } from './customer.entity';
import { CustomersMapper } from './customers.mapper';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';
import { Order } from '../orders/order.entity';
import { DashboardDTO } from 'src/dashboard/dtos/dashboard.dto';
import { CustomerStatus } from './enums/customer-status.enum';
import * as Papa from 'papaparse';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(CustomersMapper)
    private readonly customersMapper: CustomersMapper,
    @Inject('CUSTOMER_REPOSITORY')
    private customersRepository: typeof Customer,
    @Inject(PaymentConditionsService)
    private readonly paymentConditionsService: PaymentConditionsService,
    @Inject(PaymentMethodsService)
    private readonly paymentMethodsService: PaymentMethodsService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  getModel() {
    return this.customersRepository;
  }

  private async resolveSellerIds(
    companyId: number,
    sellerIds: number[],
  ): Promise<number[]> {
    const companyUserIds = await this.usersService.findCompanyUserIds(
      companyId,
    );
    return Array.from(
      new Set(sellerIds.filter((id) => companyUserIds.includes(id))),
    );
  }

  async createCustomer(
    companyId: number,
    createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    const customerExists = await this.customersRepository.findOne({
      where: { document: createCustomerDto.document, companyId },
    });

    if (customerExists)
      throw new NotFoundException(
        'Cliente já cadastrado com o CPF/CNPJ informado',
      );

    await this.companiesService.findOne(companyId);

    const customerMapped: Partial<Customer> =
      await this.customersMapper.createCustomerDtoToCustomer(
        createCustomerDto,
        companyId,
      );

    const customer = await this.customersRepository.create(
      customerMapped.dataValues,
    );

    if (createCustomerDto.sellerIds && createCustomerDto.sellerIds.length > 0) {
      const sellerIds = await this.resolveSellerIds(
        companyId,
        createCustomerDto.sellerIds,
      );
      await customer.$set('sellers', sellerIds);
    }

    return customer;
  }

  async findOne(companyId: number, customerId: number): Promise<Customer> {
    await this.companiesService.findOne(companyId);

    const customer = await this.customersRepository.findOne({
      where: { id: customerId, companyId: companyId },
      include: [
        PaymentCondition,
        PaymentMethod,
        {
          model: User,
          as: 'sellers',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!customer) throw new NotFoundException('Cliente não encontrado');

    if (customer.customerGroupCode) {
      const groupMembersCount = await this.customersRepository.count({
        where: {
          companyId,
          customerGroupCode: customer.customerGroupCode,
        },
      });

      (customer as any).groupMembersCount = groupMembersCount;
    }

    return customer;
  }

  async findOneByDocument(document: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { document },
    });

    return customer || null;
  }

  async findByIds(companyId: number, ids: number[]): Promise<Customer[]> {
    await this.companiesService.findOne(companyId);

    if (!ids.length) return [];

    return this.customersRepository.findAll({
      where: {
        companyId,
        id: { [Op.in]: ids },
      },
      attributes: [
        'id',
        'fantasyName',
        'corporateName',
        'address',
        'neighborhood',
        'city',
        'UF',
        'cep',
        'phoneNumber',
        'email',
        'status',
      ],
    });
  }

  async findAll(
    companyId: number,
    findAllDto: BaseFindAllDataDto,
    user?: AuthenticatedUserDto,
  ): Promise<{
    data: Customer[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const company = await this.companiesService.findOne(companyId);
      const { page = 1, limit = 10, sort, filters, query } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const filterQuery = buildFilterQuery(parsedFilters, Customer);
      const sortQuery = buildSortQuery(parsedSort);

      if (query) {
        // Full-text matches whole words only ('sol' misses 'Solutions'), so
        // iLike is kept alongside it so the picker works while typing.
        const partialMatch = `%${query.trim()}%`;

        filterQuery[Op.or] = [
          buildFullTextSearchWhere(['corporateName', 'fantasyName'], query),
          { document: { [Op.iLike]: partialMatch } },
          { fantasyName: { [Op.iLike]: partialMatch } },
          { corporateName: { [Op.iLike]: partialMatch } },
          Sequelize.where(
            Sequelize.cast(Sequelize.col('Customer.id'), 'TEXT'),
            {
              [Op.iLike]: partialMatch,
            },
          ),
        ];
      }

      filterQuery.companyId = company.id;

      const includes: any[] = [
        PaymentCondition,
        PaymentMethod,
        {
          model: User,
          as: 'sellers',
          attributes: ['id', 'name'],
          required: false,
          ...(user?.role === UserRole.SalesRep
            ? { where: { id: user.id }, required: true }
            : {}),
        },
        {
          model: Order,
          limit: 30,
          order: [['createdAt', 'DESC']],
          separate: true,
        },
      ];

      const total = await this.customersRepository.count({
        where: filterQuery,
        include: includes.filter((inc) => !inc.separate),
        distinct: true,
      });

      const data = await this.customersRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        include: includes,
        limit,
      });

      return {
        data,
        metadata: { page, limit, total },
      };
    } catch (error) {
      logger.error(error);
      throw new InternalServerErrorException(
        `Erro ao buscar: ${error.message}`,
      );
    }
  }

  async updateCustomer(
    companyId: number,
    customerId: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    await this.companiesService.findOne(companyId);

    const customer = await this.findOne(companyId, customerId);

    if (updateCustomerDto.document) {
      const customerExists = await this.customersRepository.findOne({
        where: { document: updateCustomerDto.document },
      });

      if (customerExists && customer.document !== updateCustomerDto.document)
        throw new NotFoundException(
          'Cliente já cadastrado com o CPF/CNPJ informado',
        );
    }

    const customerMapped =
      await this.customersMapper.updateCustomerDtoToCustomer(
        customer,
        updateCustomerDto,
      );

    await customer.update(customerMapped);
    await customer.save();

    if (updateCustomerDto.sellerIds) {
      const sellerIds = await this.resolveSellerIds(
        companyId,
        updateCustomerDto.sellerIds,
      );
      await customer.$set('sellers', sellerIds);
    }

    return customer;
  }

  async deleteCustomer(companyId: number, customerId: number): Promise<void> {
    await this.companiesService.findOne(companyId);

    const customer = await this.findOne(companyId, customerId);

    await customer.destroy();
  }

  async addPaymentCondition(
    companyId: number,
    customerId: number,
    paymentConditionId: number,
  ): Promise<void> {
    await this.companiesService.findOne(companyId);

    const customer = await this.findOne(companyId, customerId);

    this.paymentConditionsService.findOne(companyId, paymentConditionId);

    await customer.$add('paymentConditions', paymentConditionId);
  }

  async removePaymentCondition(
    companyId: number,
    customerId: number,
    paymentConditionId: number,
  ): Promise<void> {
    await this.companiesService.findOne(companyId);

    const customer = await this.findOne(companyId, customerId);

    await this.paymentConditionsService.findOne(companyId, paymentConditionId);

    await customer.$remove('paymentConditions', paymentConditionId);
  }

  async addPaymentMethod(
    companyId: number,
    customerId: number,
    paymentMethodId: number,
  ): Promise<void> {
    await this.companiesService.findOne(companyId);

    const customer = await this.findOne(companyId, customerId);

    this.paymentMethodsService.findOne(companyId, paymentMethodId);

    await customer.$add('paymentMethods', paymentMethodId);
  }

  async removePaymentMethod(
    companyId: number,
    customerId: number,
    paymentMethodId: number,
  ): Promise<void> {
    await this.companiesService.findOne(companyId);

    const customer = await this.findOne(companyId, customerId);

    await this.paymentMethodsService.findOne(companyId, paymentMethodId);

    await customer.$remove('paymentMethods', paymentMethodId);
  }

  async getCompanyTotalCustomers(data: DashboardDTO): Promise<number> {
    const { companyId, state, months, cities } = data;

    await this.companiesService.findOne(companyId);

    const customerWhereConditions: any = {
      companyId,
      ...this.buildDateWhereClause(months),
    };

    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    return this.customersRepository.count({
      where: customerWhereConditions,
    });
  }

  private buildDateWhereClause(months?: string[]): WhereOptions {
    const where: any = {};

    if (months && months.length > 0) {
      const dateConditions = months.map((monthStr) => {
        const [year, month] = monthStr.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
          throw new BadRequestException(
            `Invalid month format in months parameter: ${monthStr}`,
          );
        }
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        return {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        };
      });
      where[Op.or] = dateConditions;
    }
    return where;
  }

  async findCustomersByGroupCode(
    companyId: number,
    customerGroupCode: string,
  ): Promise<Customer[]> {
    if (!customerGroupCode) {
      throw new BadRequestException('Código do grupo de cliente não fornecido');
    }

    await this.companiesService.findOne(companyId);

    const customers = await this.customersRepository.findAll({
      where: {
        companyId,
        customerGroupCode,
      },
      include: [PaymentCondition, PaymentMethod],
    });

    return customers;
  }

  async getStates(companyId: number): Promise<string[]> {
    const company = await this.companiesService.findOne(companyId);
    if (!company) throw new NotFoundException('Empresa não encontrada');

    const states = await Customer.findAll({
      attributes: ['UF'],
      where: {
        companyId: companyId,
      },
      group: ['UF'],
      raw: true,
    });

    return states.map((result: any) => result.UF);
  }

  async getCities(companyId: number, states?: string[]): Promise<string[]> {
    const company = await this.companiesService.findOne(companyId);
    if (!company) throw new NotFoundException('Empresa não encontrada');

    const where: WhereOptions = { companyId };
    if (states && states.length > 0) {
      where.UF = { [Op.in]: states };
    }
    const cities = await Customer.findAll({
      attributes: ['city'],
      where: {
        companyId: companyId,
      },
      group: ['city'],
      raw: true,
    });

    return cities.map((result: any) => result.city);
  }

  async countCustomersWithoutOrders(data: DashboardDTO): Promise<number> {
    const { companyId, state, months, cities } = data;

    const dateRangeCondition: WhereOptions = this.buildDateWhereClause(months);

    const count = await this.customersRepository.count({
      include: [
        {
          model: Order,
          attributes: [],
          required: false,
          as: 'orders',
          where: {
            ...dateRangeCondition,
            companyId,
          },
        },
      ],
      where: {
        '$orders.id$': { [Op.is]: null },
        companyId,
        ...(cities && { city: { [Op.in]: cities } }),
        ...(state && { UF: { [Op.in]: state } }),
      },
      distinct: true,
    });

    return count;
  }

  async countCustomerCitiesWithoutOrders(data: DashboardDTO): Promise<number> {
    const { companyId, state, months, cities } = data;

    const dateRangeCondition: WhereOptions = this.buildDateWhereClause(months);

    const count = await this.customersRepository.count({
      include: [
        {
          model: Order,
          attributes: [],
          required: false,
          as: 'orders',
          where: {
            ...dateRangeCondition,
            companyId,
          },
        },
      ],
      where: {
        '$orders.id$': { [Op.is]: null },
        companyId,
        ...(cities && { city: { [Op.in]: cities } }),
        ...(state && { UF: { [Op.in]: state } }),
      },
      distinct: true,
      col: 'city',
    });

    return count;
  }

  async countNewCustomers(data: DashboardDTO): Promise<number> {
    const { companyId, state, months, cities } = data;

    const dateRangeCondition: WhereOptions = this.buildDateWhereClause(months);

    const count = await this.customersRepository.count({
      where: {
        companyId,
        ...(cities && { city: { [Op.in]: cities } }),
        ...(state && { UF: { [Op.in]: state } }),
        ...dateRangeCondition,
      },
      distinct: true,
    });

    return count;
  }

  async createdBeforeAndNotInList(
    companyId: number,
    customerIds: number[],
    startDate: Date,
  ): Promise<Customer[]> {
    return this.customersRepository.findAll({
      where: {
        createdAt: { [Op.lt]: startDate },
        companyId,
        id: {
          [Op.notIn]: customerIds,
        },
      },
    });
  }

  async importCustomersFromCSV(
    companyId: number,
    buffer: Buffer,
    mode: 'create' | 'update' = 'create',
  ): Promise<{ count: number }> {
    await this.companiesService.findOne(companyId);
    const csvData = buffer.toString('utf-8');

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        transform: (value: string, header: string) => {
          if (!value) return value;
          const floatColumns = ['limiteCredito'];
          if (floatColumns.includes(header)) {
            const lastComma = value.lastIndexOf(',');
            const lastDot = value.lastIndexOf('.');
            if (lastComma > lastDot) {
              return value.replace(/\./g, '').replace(',', '.');
            }
            return value.replace(/,/g, '');
          }
          return value;
        },
        complete: async (results) => {
          if (results.errors.length) {
            return reject(
              new BadRequestException('Erro ao fazer parse do arquivo CSV.'),
            );
          }

          try {
            this._validateCSVHeaders(results.meta.fields);
          } catch (error) {
            return reject(error);
          }

          const transaction =
            await this.customersRepository.sequelize.transaction();

          try {
            const data = results.data as any[];
            let count: number;

            if (mode === 'create') {
              count = await this._bulkCreateCustomers(
                data,
                companyId,
                transaction,
              );
            } else {
              count = await this._bulkUpdateCustomers(
                data,
                companyId,
                transaction,
              );
            }

            await transaction.commit();
            resolve({ count });
          } catch (error) {
            await transaction.rollback();
            reject(
              new InternalServerErrorException(
                'Erro ao importar clientes: ' + error.message,
              ),
            );
          }
        },
        error: (error) => {
          reject(new BadRequestException(`Erro ao ler CSV: ${error.message}`));
        },
      });
    });
  }

  private _validateCSVHeaders(actualHeaders: string[]): void {
    const expectedHeaders = [
      'razaoSocial',
      'nomeFantasia',
      'cpfCnpj',
      'cep',
      'endereco',
      'cidade',
      'uf',
      'bairro',
      'telefone',
      'email',
    ];

    const missingHeaders = expectedHeaders.filter(
      (header) => !actualHeaders.includes(header),
    );

    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `O arquivo CSV não contém as seguintes colunas obrigatórias: ${missingHeaders.join(
          ', ',
        )}`,
      );
    }
  }

  private async _bulkCreateCustomers(
    data: any[],
    companyId: number,
    transaction: any,
  ): Promise<number> {
    const customersToCreate = data.map((item) => ({
      corporateName: item.razaoSocial,
      fantasyName: item.nomeFantasia,
      document: item.cpfCnpj,
      creditLimit: item.limiteCredito ? parseFloat(item.limiteCredito) : 0,
      stateRegistration: item.inscricaoEstadual || null,
      gln: item.gln || null,
      cep: item.cep,
      address: item.endereco,
      city: item.cidade,
      UF: this._normalizeState(item.uf),
      neighborhood: item.bairro,
      phoneNumber: item.telefone,
      email: item.email,
      companyId,
    }));

    const created = await this.customersRepository.bulkCreate(
      customersToCreate,
      { validate: true, ignoreDuplicates: true, transaction },
    );
    return created.length;
  }

  private async _bulkUpdateCustomers(
    data: any[],
    companyId: number,
    transaction: any,
  ): Promise<number> {
    let updatedCountTotal = 0;
    for (const item of data) {
      if (!item.cpfCnpj) continue;

      const customerToUpdate = {
        corporateName: item.razaoSocial,
        fantasyName: item.nomeFantasia,
        creditLimit: item.limiteCredito
          ? parseFloat(item.limiteCredito)
          : undefined,
        stateRegistration: item.inscricaoEstadual,
        gln: item.gln,
        cep: item.cep,
        address: item.endereco,
        city: item.cidade,
        UF: this._normalizeState(item.uf),
        neighborhood: item.bairro,
        phoneNumber: item.telefone,
        email: item.email,
      };

      Object.keys(customerToUpdate).forEach(
        (key) =>
          customerToUpdate[key] === undefined && delete customerToUpdate[key],
      );

      const [updatedCount] = await this.customersRepository.update(
        customerToUpdate,
        { where: { document: item.cpfCnpj, companyId }, transaction },
      );

      if (updatedCount > 0) updatedCountTotal++;
    }
    return updatedCountTotal;
  }

  private _normalizeState(state: string): string {
    if (!state) return state;

    const stateMap: { [key: string]: string } = {
      acre: 'AC',
      alagoas: 'AL',
      amapá: 'AP',
      amapa: 'AP',
      amazonas: 'AM',
      bahia: 'BA',
      ceará: 'CE',
      ceara: 'CE',
      'distrito federal': 'DF',
      'espírito santo': 'ES',
      'espirito santo': 'ES',
      goiás: 'GO',
      goias: 'GO',
      maranhão: 'MA',
      maranhao: 'MA',
      'mato grosso': 'MT',
      'mato grosso do sul': 'MS',
      'minas gerais': 'MG',
      pará: 'PA',
      para: 'PA',
      paraíba: 'PB',
      paraiba: 'PB',
      paraná: 'PR',
      parana: 'PR',
      pernambuco: 'PE',
      piauí: 'PI',
      piaui: 'PI',
      'rio de janeiro': 'RJ',
      'rio grande do norte': 'RN',
      'rio grande do sul': 'RS',
      rondônia: 'RO',
      rondonia: 'RO',
      roraima: 'RR',
      'santa catarina': 'SC',
      'são paulo': 'SP',
      'sao paulo': 'SP',
      sergipe: 'SE',
      tocantins: 'TO',
    };

    const normalizedState = state.toLowerCase().trim();
    return stateMap[normalizedState] || state.toUpperCase();
  }
}
