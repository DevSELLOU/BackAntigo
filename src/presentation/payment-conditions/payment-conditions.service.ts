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
import { logger } from 'src/utils/logger';
import { Customer } from '../customers/customer.entity';
import { CreatePaymentConditionDto } from './dtos/create-payment-condition.dto';
import { UpdatePaymentConditionDto } from './dtos/update-payment-condition.dto';
import { PaymentCondition } from './payment-condition.entity';
import { PaymentConditionsMapper } from './payment-conditions.mapper';
import * as Papa from 'papaparse';

@Injectable()
export class PaymentConditionsService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(PaymentConditionsMapper)
    private readonly paymentConditionsMapper: PaymentConditionsMapper,
    @Inject('PAYMENT_CONDITION_REPOSITORY')
    private paymentConditionsRepository: typeof PaymentCondition,
  ) {}

  getModel() {
    return this.paymentConditionsRepository;
  }

  async createPaymentCondition(
    createPaymentConditionDto: CreatePaymentConditionDto,
    companyId: number,
  ): Promise<PaymentCondition> {
    await this.companiesService.findOne(companyId);

    const paymentConditionMapped: Partial<PaymentCondition> =
      await this.paymentConditionsMapper.createPaymentConditionDtoToPaymentCondition(
        createPaymentConditionDto,
        companyId,
      );

    const paymentCondition = await this.paymentConditionsRepository.create(
      paymentConditionMapped.dataValues,
    );

    return paymentCondition;
  }

  async findOne(
    companyId: number,
    paymentConditionId: number,
  ): Promise<PaymentCondition> {
    await this.companiesService.findOne(companyId);

    const paymentCondition = await this.paymentConditionsRepository.findOne({
      where: { id: paymentConditionId, companyId: companyId },
    });

    if (!paymentCondition)
      throw new NotFoundException('Condição de Pagamento não encontrada');

    return paymentCondition;
  }

  async findAll(
    companyId: number,
    findAllDto: BaseFindAllDataDto,
    customerId?: number,
  ): Promise<{
    data: PaymentCondition[];
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
            Sequelize.cast(Sequelize.col('PaymentCondition.id'), 'TEXT'),
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

      const total = await this.paymentConditionsRepository.count({
        where: filterQuery,
      });

      const data = await this.paymentConditionsRepository.findAll({
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

  async updatePaymentCondition(
    companyId: number,
    paymentConditionId: number,
    updatePaymentConditionDto: UpdatePaymentConditionDto,
  ): Promise<PaymentCondition> {
    await this.companiesService.findOne(companyId);

    const paymentCondition = await this.findOne(companyId, paymentConditionId);

    const paymentConditionMapped =
      await this.paymentConditionsMapper.updatePaymentConditionDtoToPaymentCondition(
        paymentCondition,
        updatePaymentConditionDto,
      );

    await paymentCondition.update(paymentConditionMapped);
    await paymentCondition.save();
    return paymentCondition;
  }

  async deletePaymentCondition(
    companyId: number,
    paymentConditionId: number,
  ): Promise<void> {
    await this.companiesService.findOne(companyId);

    const paymentCondition = await this.findOne(companyId, paymentConditionId);

    await paymentCondition.destroy();
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
            await this.paymentConditionsRepository.sequelize.transaction();

          try {
            const data = results.data as any[];
            let count = 0;

            for (const item of data) {
              if (!item.nome) continue;

              if (mode === 'create') {
                await this.paymentConditionsRepository.create(
                  {
                    name: item.nome,
                    description: item.descricao || null,
                    companyId,
                  },
                  { transaction },
                );
                count++;
              } else if (mode === 'update') {
                const existing = await this.paymentConditionsRepository.findOne(
                  {
                    where: { name: item.nome, companyId },
                    transaction,
                  },
                );

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
                'Erro ao importar condições de pagamento.',
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
