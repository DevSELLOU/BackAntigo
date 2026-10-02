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
import { PriceTableItem } from '../price-table-items/price-table-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductsService } from '../products/products.service';
import { PriceTableRule } from '../price-table-rules/price-table-rule.entity';
import { CreatePriceTableDto } from './dtos/create-price-table.dto';
import { ImportPriceTableDto } from './dtos/import-price-table.dto';
import { UpdatePriceTableStatusDto } from './dtos/update-price-table-status.dto';
import { UpdatePriceTableDto } from './dtos/update-price-table.dto';
import { PriceTable } from './price-table.entity';
import { PriceTablesMapper } from './price-tables.mapper';
import * as Papa from 'papaparse';
import { parseNumber } from 'src/utils/parse-number.util';

@Injectable()
export class PriceTablesService {
  constructor(
    @Inject('PRICE_TABLE_REPOSITORY')
    private priceTablesRepository: typeof PriceTable,
    @Inject('PRICE_TABLE_ITEM_REPOSITORY')
    private priceTablesItemsRepository: typeof PriceTableItem,
    @Inject('PRICE_TABLE_RULE_REPOSITORY')
    private priceTableRulesRepository: typeof PriceTableRule,
    @Inject(PriceTablesMapper)
    private readonly priceTablesMapper: PriceTablesMapper,
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(ProductsService)
    private readonly productsService: ProductsService,
  ) {}

  getModel() {
    return this.priceTablesRepository;
  }

  private parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr.trim() === '') return null;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  async createPriceTable(
    companyId: number,
    createPriceTableDto: CreatePriceTableDto,
  ): Promise<PriceTable> {
    logger.info(
      `[PRICE-TABLES-SERVICE] Creating price table | companyId: ${companyId} | name: ${createPriceTableDto.name}`,
    );

    await this.companiesService.findOne(companyId);

    logger.info(
      `[PRICE-TABLES-SERVICE] Mapping DTO to model | companyId: ${companyId}`,
    );

    const { rules, ...priceTableData } = createPriceTableDto;

    const priceTableMapped: Partial<PriceTable> =
      await this.priceTablesMapper.createPriceTableDtoToPriceTable(
        priceTableData as any,
      );

    logger.info(
      `[PRICE-TABLES-SERVICE] Persisting price table to database | companyId: ${companyId}`,
    );

    const priceTable = await this.priceTablesRepository.create({
      ...priceTableMapped.dataValues,
      companyId,
    });

    if (rules && rules.length > 0) {
      logger.info(
        `[PRICE-TABLES-SERVICE] Creating price table rules | priceTableId: ${priceTable.id} | rulesCount: ${rules.length}`,
      );
      const rulesToCreate = rules.map((rule) => ({
        priceTableId: priceTable.id,
        priority: rule.priority ?? null,
        conditions: rule.conditions ?? null,
        adjustmentType: rule.adjustmentType ?? null,
        adjustmentValue: rule.adjustmentValue ?? null,
      }));
      await this.priceTableRulesRepository.bulkCreate(rulesToCreate);
    }

    logger.info(
      `[PRICE-TABLES-SERVICE] Initializing price table items for all products | priceTableId: ${priceTable.id} | companyId: ${companyId}`,
    );

    const allProducts = await this.productsService.findAll(companyId, {
      page: 1,
      limit: 10000,
    });

    if (allProducts.data.length > 0) {
      const orderItems = allProducts.data.map((product) => ({
        priceTableId: priceTable.id,
        productId: product.id,
        manualPrice: null,
        isManual: false,
      }));
      await this.priceTablesItemsRepository.bulkCreate(orderItems);
    }

    return priceTable;
  }

  async findOne(companyId: number, id: number): Promise<PriceTable> {
    await this.companiesService.findOne(companyId);

    const priceTable = await this.priceTablesRepository.findOne({
      where: { id, companyId },
      include: [
        {
          model: PriceTableItem,
          include: [Product],
        },
        PriceTableRule,
      ],
    });

    if (!priceTable)
      throw new NotFoundException('Tabela de preço não encontrada');

    return priceTable;
  }

  async findAll(
    companyId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: PriceTable[];
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
          buildFullTextSearchWhere(['name', 'description'], query, 'PriceTable'),
          Sequelize.where(
            Sequelize.cast(Sequelize.col('PriceTable.id'), 'TEXT'),
            {
              [Op.iLike]: `%${query}%`,
            },
          ),
        ];
      }

      filterQuery.companyId = company.id;

      const total = await this.priceTablesRepository.count({
        where: filterQuery,
      });

      const data = await this.priceTablesRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
        include: [
          {
            model: PriceTableItem,
            include: [Product],
          },
        ],
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

  async updatePriceTable(
    companyId: number,
    id: number,
    updatePriceTableDto: UpdatePriceTableDto,
  ): Promise<PriceTable> {
    await this.companiesService.findOne(companyId);

    const priceTable = await this.findOne(companyId, id);

    const hasAdjustmentChange =
      (updatePriceTableDto.adjustmentType !== undefined &&
        updatePriceTableDto.adjustmentType !== priceTable.adjustmentType) ||
      (updatePriceTableDto.adjustmentValue !== undefined &&
        updatePriceTableDto.adjustmentValue !== priceTable.adjustmentValue);

    const priceTableMapped =
      await this.priceTablesMapper.updatePriceTableDtoToPriceTable(
        priceTable,
        updatePriceTableDto as any,
      );

    await priceTable.update({
      ...priceTableMapped,
    });
    await priceTable.save();

    if (updatePriceTableDto.rules !== undefined) {
      await this.priceTableRulesRepository.destroy({
        where: { priceTableId: id },
      });

      if (updatePriceTableDto.rules && updatePriceTableDto.rules.length > 0) {
        const rulesToCreate = updatePriceTableDto.rules.map((rule) => ({
          priceTableId: id,
          priority: rule.priority ?? null,
          conditions: rule.conditions ?? null,
        }));
        await this.priceTableRulesRepository.bulkCreate(rulesToCreate);
      }
    }

    if (
      hasAdjustmentChange &&
      priceTable.adjustmentType &&
      priceTable.adjustmentValue
    ) {
      const items = await this.priceTablesItemsRepository.findAll({
        where: { priceTableId: id },
        include: [Product],
      });

      for (const item of items) {
        const basePrice = Number(item.product.price);
        let newPrice = basePrice;
        const adjustmentValue = Number(priceTable.adjustmentValue);

        if (priceTable.adjustmentType === 'PERCENTAGE_DISCOUNT') {
          newPrice = basePrice - (basePrice * adjustmentValue) / 100;
        } else if (priceTable.adjustmentType === 'PERCENTAGE_MARKUP') {
          newPrice = basePrice + (basePrice * adjustmentValue) / 100;
        } else if (priceTable.adjustmentType === 'FIXED_VALUE') {
          newPrice = basePrice + adjustmentValue;
        }

        item.manualPrice = newPrice;
        item.isManual = true;
        await item.save();
      }
    }

    return this.findOne(companyId, id);
  }

  async deletePriceTable(companyId: number, id: number): Promise<void> {
    logger.info(
      `[PRICE-TABLES-SERVICE] Deleting price table | priceTableId: ${id} | companyId: ${companyId}`,
    );

    await this.companiesService.findOne(companyId);

    const priceTable = await this.findOne(companyId, id);

    logger.info(
      `[PRICE-TABLES-SERVICE] Deleting price table items | priceTableId: ${id}`,
    );

    await priceTable.destroy();

    logger.info(
      `[PRICE-TABLES-SERVICE] Price table deleted successfully | priceTableId: ${id} | companyId: ${companyId}`,
    );
  }

  async updatePriceTableStatus(
    companyId: number,
    id: number,
    updatePriceTableStatusDto: UpdatePriceTableStatusDto,
  ): Promise<PriceTable> {
    logger.info(
      `[PRICE-TABLES-SERVICE] Updating price table status | priceTableId: ${id} | companyId: ${companyId} | newStatus: ${updatePriceTableStatusDto.status}`,
    );

    await this.companiesService.findOne(companyId);

    const priceTable = await this.findOne(companyId, id);

    logger.info(
      `[PRICE-TABLES-SERVICE] Current status | priceTableId: ${id} | oldStatus: ${priceTable.status}`,
    );

    const priceTableMapped =
      await this.priceTablesMapper.updatePriceTableStatusDtoToPriceTable(
        priceTable,
        updatePriceTableStatusDto,
      );

    await priceTable.update(priceTableMapped);
    await priceTable.save();

    logger.info(
      `[PRICE-TABLES-SERVICE] Price table status updated | priceTableId: ${id} | newStatus: ${priceTable.status}`,
    );

    return priceTable;
  }

  async importPriceTable(
    companyId: number,
    importDto: ImportPriceTableDto,
    buffer?: Buffer,
  ): Promise<{ priceTable: PriceTable; processedRows: number }> {
    logger.info(
      `[PRICE-TABLES-SERVICE] Importing price table | companyId: ${companyId} | name: ${importDto.name}`,
    );

    await this.companiesService.findOne(companyId);

    const { rules, ...priceTableData } = importDto;

    logger.info(
      `[PRICE-TABLES-SERVICE] Creating price table from import | companyId: ${companyId}`,
    );

    const priceTable = await this.priceTablesRepository.create({
      ...priceTableData,
      startDate: this.parseDate(priceTableData.startDate),
      endDate: this.parseDate(priceTableData.endDate),
      companyId,
    });

    if (rules && rules.length > 0) {
      logger.info(
        `[PRICE-TABLES-SERVICE] Importing rules | priceTableId: ${priceTable.id} | rulesCount: ${rules.length}`,
      );
      const rulesToCreate = rules.map((rule) => ({
        priceTableId: priceTable.id,
        priority: rule.priority || 0,
        conditions: rule.conditions || [],
      }));
      await this.priceTableRulesRepository.bulkCreate(rulesToCreate);
    }

    let processedRows = 0;
    if (buffer) {
      logger.info(
        `[PRICE-TABLES-SERVICE] Processing CSV file | priceTableId: ${priceTable.id}`,
      );

      const csvData = buffer.toString('utf-8');
      const parsed = await new Promise<any>((resolve, reject) => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results),
          error: (error) => reject(error),
        });
      });

      const validSkus: string[] = [];
      const invalidSkus: string[] = [];

      for (const row of parsed.data) {
        if (row.sku) {
          validSkus.push(row.sku);
        }
      }

      logger.info(
        `[PRICE-TABLES-SERVICE] Parsed CSV - valid SKUs: ${validSkus.length}, invalid: ${invalidSkus.length}`,
      );

      const products = await this.productsService.findAllByIds([], companyId);
      const productMap = new Map(products.map((p) => [p.reference, p.id]));

      const itemsToCreate: { priceTableId: number; productId: number }[] = [];

      for (const sku of validSkus) {
        const productId = productMap.get(sku);
        if (productId) {
          itemsToCreate.push({ priceTableId: priceTable.id, productId });
        } else {
          invalidSkus.push(sku);
        }
      }

      if (itemsToCreate.length > 0) {
        await this.priceTablesItemsRepository.bulkCreate(itemsToCreate);
      }

      processedRows = itemsToCreate.length;

      if (invalidSkus.length > 0) {
        logger.warn(`Invalid SKUs found: ${invalidSkus.join(', ')}`);
      }
    }

    return { priceTable, processedRows };
  }

  async findPriceTableItems(
    companyId: number,
    priceTableId: number,
  ): Promise<{ productId: number; manualPrice: number | null }[]> {
    await this.companiesService.findOne(companyId);
    await this.findOne(companyId, priceTableId);

    const items = await this.priceTablesItemsRepository.findAll({
      where: { priceTableId },
      attributes: ['productId', 'manualPrice'],
    });

    return items.map((item) => ({
      productId: item.productId,
      manualPrice: item.manualPrice,
    }));
  }

  async updatePriceTableItems(
    companyId: number,
    priceTableId: number,
    items: { productId: number; manualPrice: number | null }[],
  ): Promise<void> {
    await this.companiesService.findOne(companyId);
    await this.findOne(companyId, priceTableId);

    const productIds = items.map((item) => item.productId);
    const existingItems = await this.priceTablesItemsRepository.findAll({
      where: { priceTableId, productId: { [Op.in]: productIds } },
    });

    const existingMap = new Map(
      existingItems.map((item) => [item.productId, item]),
    );

    for (const item of items) {
      const existing = existingMap.get(item.productId);
      const parsedPrice = parseNumber(item.manualPrice);

      if (existing) {
        existing.manualPrice = parsedPrice;
        existing.isManual = parsedPrice !== null;
        await existing.save();
      } else {
        await this.priceTablesItemsRepository.create({
          priceTableId,
          productId: item.productId,
          manualPrice: parsedPrice,
          isManual: parsedPrice !== null,
        });
      }
    }
  }

  async importPriceTableItems(
    companyId: number,
    priceTableId: number,
    buffer: Buffer,
  ): Promise<{ imported: number; errors: string[] }> {
    logger.info(
      `[PRICE-TABLES-SERVICE] Importing items | priceTableId: ${priceTableId}`,
    );

    const priceTable = await this.priceTablesRepository.findOne({
      where: { id: priceTableId, companyId },
    });

    if (!priceTable) {
      throw new NotFoundException('Tabela de preço não encontrada');
    }

    const csvData = buffer.toString('utf-8');
    const parsed = await new Promise<any>((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results),
        error: (error) => reject(error),
      });
    });

    const errors: string[] = [];
    const items: { productId: number; manualPrice: number | null }[] = [];

    for (const row of parsed.data) {
      const productId = parseInt(row.productId);
      const price = parseNumber(row.price);

      if (isNaN(productId)) {
        errors.push(`productId inválido: ${row.productId}`);
        continue;
      }

      if (price !== null && isNaN(price)) {
        errors.push(`price inválido para productId ${productId}: ${row.price}`);
        continue;
      }

      items.push({ productId, manualPrice: price });
    }

    if (errors.length > 0 && items.length === 0) {
      throw new BadRequestException('Nenhum item válido para importar');
    }

    const productIds = [...new Set(items.map((item) => item.productId))];

    const products = await this.productsService.findAllByIds(
      productIds,
      companyId,
    );
    const validProductIds = new Set(products.map((p) => p.id));

    const invalidProductIds = productIds.filter(
      (id) => !validProductIds.has(id),
    );
    for (const id of invalidProductIds) {
      errors.push(`Produto não encontrado ou não pertence à empresa: ${id}`);
    }

    const validItems = items.filter(
      (item) =>
        item.manualPrice !== null && validProductIds.has(item.productId),
    );

    if (validItems.length > 0) {
      await this.priceTablesItemsRepository.destroy({
        where: { priceTableId },
      });

      await this.priceTablesItemsRepository.bulkCreate(
        validItems.map((item) => ({
          priceTableId,
          productId: item.productId,
          manualPrice: item.manualPrice,
          isManual: true,
        })),
      );
    }

    logger.info(
      `[PRICE-TABLES-SERVICE] Import completed | priceTableId: ${priceTableId} | imported: ${validItems.length}`,
    );

    return {
      imported: validItems.length,
      errors,
    };
  }
}
