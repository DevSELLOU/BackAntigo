import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { CompaniesService } from 'src/companies/companies.service';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { buildFullTextSearchWhere } from 'src/utils/fulltext-utils';
import { Customer } from '../customers/customer.entity';
import { CreatePaymentMethodDto } from './dtos/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dtos/update-payment-method.dto';
import { PaymentMethod } from './payment-method.entity';
import { PaymentMethodsMapper } from './payment-methods.mapper';
import * as Papa from 'papaparse';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(PaymentMethodsMapper)
    private readonly paymentMethodsMapper: PaymentMethodsMapper,
    @Inject('PAYMENT_METHOD_REPOSITORY')
    private paymentMethodsRepository: typeof PaymentMethod,
  ) {}

  getModel() {
    return this.paymentMethodsRepository;
  }

  async createPaymentMethod(
    createPaymentMethodDto: CreatePaymentMethodDto,
    companyId: number,
  ): Promise<PaymentMethod> {
    await this.companiesService.findOne(companyId);

    const paymentMethodMapped: Partial<PaymentMethod> =
      await this.paymentMethodsMapper.createPaymentMethodDtoToPaymentMethod(
        createPaymentMethodDto,
        companyId,
      );

    const paymentMethod = await this.paymentMethodsRepository.create(
      paymentMethodMapped.dataValues,
    );

    return paymentMethod;
  }

  async findOne(
    companyId: number,
    paymentMethodId: number,
  ): Promise<PaymentMethod> {
    await this.companiesService.findOne(companyId);

    const paymentMethod = await this.paymentMethodsRepository.findOne({
      where: { id: paymentMethodId, companyId: companyId },
    });

    if (!paymentMethod)
      throw new NotFoundException('Condição de Pagamento não encontrada');

    return paymentMethod;
  }

  async findAll(
    companyId: number,
    findAllDto: BaseFindAllDataDto,
    customerId?: number,
  ): Promise<{
    data: PaymentMethod[];
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
          buildFullTextSearchWhere(['name', 'description'], query),
          Sequelize.where(
            Sequelize.cast(Sequelize.col('PaymentMethod.id'), 'TEXT'),
            {
              [Op.iLike]: `%${query}%`,
            },
          ),
        ];
      }

      filterQuery.companyId = company.id;

      const include = [];
      if (customerId) {
        include.push({
          model: Customer,
          as: 'customers',
          where: { id: customerId },
          through: { attributes: [] },
        });
      }

      const total = await this.paymentMethodsRepository.count({
        where: filterQuery,
      });

      const data = await this.paymentMethodsRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
        include,
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

  async updatePaymentMethod(
    companyId: number,
    paymentMethodId: number,
    updatePaymentMethodDto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    await this.companiesService.findOne(companyId);

    const paymentMethod = await this.findOne(companyId, paymentMethodId);

    const paymentMethodMapped =
      await this.paymentMethodsMapper.updatePaymentMethodDtoToPaymentMethod(
        paymentMethod,
        updatePaymentMethodDto,
      );

    await paymentMethod.update(paymentMethodMapped);
    await paymentMethod.save();
    return paymentMethod;
  }

  async deletePaymentMethod(
    companyId: number,
    paymentMethodId: number,
  ): Promise<void> {
    await this.companiesService.findOne(companyId);

    const paymentMethod = await this.findOne(companyId, paymentMethodId);

    await paymentMethod.destroy();
  }

  async importFromCSV(
    companyId: number,
    buffer: Buffer,
    mode: 'create' | 'update' = 'create',
  ): Promise<{ count: number }> {
    await this.companiesService.findOne(companyId);
    const csvData = buffer.toString('utf-8');

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.errors.length) {
            return reject(
              new BadRequestException('Erro ao fazer parse do ficheiro CSV.'),
            );
          }

          const transaction =
            await this.paymentMethodsRepository.sequelize.transaction();

          try {
            const data = results.data as any[];
            let count = 0;

            for (const item of data) {
              if (!item.nome) continue;

              if (mode === 'create') {
                await this.paymentMethodsRepository.create(
                  {
                    name: item.nome,
                    description: item.descricao || null,
                    companyId,
                  },
                  { transaction },
                );
                count++;
              } else if (mode === 'update') {
                const existing = await this.paymentMethodsRepository.findOne({
                  where: { name: item.nome, companyId },
                  transaction,
                });

                if (existing) {
                  await existing.update(
                    {
                      description:
                        item.descricao !== undefined
                          ? item.descricao
                          : existing.description,
                    },
                    { transaction },
                  );
                  count++;
                }
              }
            }

            await transaction.commit();
            resolve({ count });
          } catch (error) {
            await transaction.rollback();
            reject(
              new InternalServerErrorException(
                'Erro ao importar métodos de pagamento.',
              ),
            );
          }
        },
        error: (error) => {
          reject(
            new BadRequestException(
              `Erro ao fazer parse do CSV: ${error.message}`,
            ),
          );
        },
      });
    });
  }
}
