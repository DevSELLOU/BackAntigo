import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { PriceTable } from '../price-tables/price-table.entity';
import { PriceTableItem } from '../price-table-items/price-table-item.entity';
import {
  PriceTableRule,
  RuleCondition,
} from '../price-table-rules/price-table-rule.entity';
import { Product } from '../products/entities/product.entity';

export interface CustomerContext {
  customerId?: number;
  customerTier?: string;
  state?: string;
  region?: string;
  productCategoryId?: number;
  segmentId?: number;
  paymentMethodId?: number;
  paymentConditionId?: number;
  minimumOrderValue?: number;
}

export interface PriceCalculationResult {
  basePrice: number;
  finalPrice: number;
  minPrice: number;
  priceTableId: number | null;
  priceTableName: string | null;
  isManual: boolean;
  isCappedByMinPrice: boolean;
}

@Injectable()
export class PricingService {
  constructor(
    @Inject('PRICE_TABLE_REPOSITORY')
    private priceTablesRepository: typeof PriceTable,
    @Inject('PRICE_TABLE_ITEM_REPOSITORY')
    private priceTableItemsRepository: typeof PriceTableItem,
    @Inject('PRICE_TABLE_RULE_REPOSITORY')
    private priceTableRulesRepository: typeof PriceTableRule,
    @Inject('PRODUCT_REPOSITORY')
    private productsRepository: typeof Product,
  ) {}

  async calculateEffectivePrice(
    productId: number,
    customerContext: CustomerContext,
    companyId: number,
  ): Promise<PriceCalculationResult> {
    const product = await this.productsRepository.findByPk(productId);
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const basePrice = Number(product.price);
    const minPrice = product.minPrice ? Number(product.minPrice) : 0;

    const applicableTable = await this.findApplicablePriceTable(
      companyId,
      customerContext,
    );

    if (applicableTable) {
      const priceTableItem = await this.priceTableItemsRepository.findOne({
        where: {
          priceTableId: applicableTable.id,
          productId,
        },
      });

      if (priceTableItem && priceTableItem.manualPrice !== null) {
        const finalPrice = Math.max(
          Number(priceTableItem.manualPrice),
          minPrice,
        );
        return {
          basePrice,
          finalPrice,
          minPrice,
          priceTableId: applicableTable.id,
          priceTableName: applicableTable.name,
          isManual: true,
          isCappedByMinPrice: finalPrice < minPrice,
        };
      }

      const adjusted = this.applyTableAdjustment(
        basePrice,
        applicableTable,
        minPrice,
      );
      if (adjusted) {
        return {
          basePrice,
          finalPrice: adjusted.finalPrice,
          minPrice,
          priceTableId: applicableTable.id,
          priceTableName: applicableTable.name,
          isManual: adjusted.isManual,
          isCappedByMinPrice: adjusted.isCappedByMinPrice,
        };
      }
    }

    return {
      basePrice,
      finalPrice: Math.max(basePrice, minPrice),
      minPrice,
      priceTableId: null,
      priceTableName: null,
      isManual: false,
      isCappedByMinPrice: false,
    };
  }

  private applyTableAdjustment(
    basePrice: number,
    priceTable: PriceTable,
    minPrice: number,
  ) {
    if (!priceTable.adjustmentType || !priceTable.adjustmentValue) {
      return null;
    }

    let adjustedPrice = basePrice;
    const adjustmentValue = Number(priceTable.adjustmentValue);

    if (priceTable.adjustmentType === 'PERCENTAGE_DISCOUNT') {
      adjustedPrice = basePrice - (basePrice * adjustmentValue) / 100;
    } else if (priceTable.adjustmentType === 'PERCENTAGE_MARKUP') {
      adjustedPrice = basePrice + (basePrice * adjustmentValue) / 100;
    } else if (priceTable.adjustmentType === 'FIXED_VALUE') {
      adjustedPrice = basePrice + adjustmentValue;
    }

    const finalPrice = Math.max(adjustedPrice, minPrice);
    return {
      finalPrice,
      isManual: false,
      isCappedByMinPrice: finalPrice < minPrice,
    };
  }

  private async findApplicablePriceTable(
    companyId: number,
    customerContext: CustomerContext,
  ): Promise<PriceTable | null> {
    const now = new Date();

    const activeTables = await this.priceTablesRepository.findAll({
      where: {
        companyId,
        status: 'ACTIVE',
        [Op.or]: [{ startDate: { [Op.lte]: now } }, { startDate: null }],
        [Op.or]: [{ endDate: { [Op.gte]: now } }, { endDate: null }],
      },
      order: [['createdAt', 'DESC']],
    });

    let bestTable: PriceTable | null = null;
    let highestScore = 0;

    for (const table of activeTables) {
      const rules = await this.priceTableRulesRepository.findAll({
        where: { priceTableId: table.id },
        order: [['priority', 'DESC']],
      });

      if (rules.length === 0) {
        if (highestScore === 0) {
          bestTable = table;
          highestScore = 0;
        }
        continue;
      }

      for (const rule of rules) {
        if (!rule.conditions || rule.conditions.length === 0) {
          if (highestScore === 0) {
            bestTable = table;
            highestScore = 0;
          }
          continue;
        }

        const score = this.calculateMatchScore(
          rule.conditions,
          customerContext,
        );
        if (score > highestScore) {
          highestScore = score;
          bestTable = table;
        }
      }
    }

    return bestTable;
  }

  private calculateMatchScore(
    conditions: RuleCondition[],
    context: CustomerContext,
  ): number {
    let score = 0;

    for (const condition of conditions) {
      const contextValue = this.getContextValue(condition.field, context);
      if (contextValue === undefined) continue;

      if (this.evaluateCondition(condition, contextValue)) {
        score += this.getFieldWeight(condition.field);
      }
    }

    return score;
  }

  private getContextValue(
    field: string,
    context: CustomerContext,
  ): string | number | undefined {
    const fieldMap: Record<string, keyof CustomerContext> = {
      customerId: 'customerId',
      customerTier: 'customerTier',
      state: 'state',
      region: 'region',
      productCategoryId: 'productCategoryId',
      segmentId: 'segmentId',
      paymentMethodId: 'paymentMethodId',
      paymentConditionId: 'paymentConditionId',
      minimumOrderValue: 'minimumOrderValue',
    };

    const key = fieldMap[field];
    return key ? context[key] : undefined;
  }

  private getFieldWeight(field: string): number {
    const weights: Record<string, number> = {
      segmentId: 60,
      paymentConditionId: 55,
      paymentMethodId: 50,
      productCategoryId: 45,
      state: 40,
      region: 35,
      customerTier: 30,
      minimumOrderValue: 25,
      customerId: 100,
    };

    return weights[field] || 1;
  }

  private evaluateCondition(
    condition: RuleCondition,
    contextValue: string | number,
  ): boolean {
    const { operator, value } = condition;

    switch (operator) {
      case 'EQUALS':
        return contextValue === value;
      case 'CONTAINS':
        return String(contextValue).includes(String(value));
      case 'IN':
        if (Array.isArray(value)) {
          return value.some((v) => String(v) === String(contextValue));
        }
        return false;
      case 'GREATER_THAN_OR_EQUALS':
        if (typeof contextValue === 'number' && typeof value === 'string') {
          return contextValue >= parseFloat(value);
        }
        return false;
      default:
        return false;
    }
  }

  async calculatePriceForProductGrid(
    productId: number,
    companyId: number,
  ): Promise<Map<number, PriceCalculationResult>> {
    const product = await this.productsRepository.findByPk(productId);
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const activeTables = await this.priceTablesRepository.findAll({
      where: {
        companyId,
        status: 'ACTIVE',
      },
    });

    const result = new Map<number, PriceCalculationResult>();

    for (const table of activeTables) {
      const priceResult = await this.calculateEffectivePrice(
        productId,
        {},
        companyId,
      );
      result.set(table.id, priceResult);
    }

    return result;
  }

  async updateManualPrice(
    productId: number,
    priceTableId: number,
    manualPrice: number,
  ): Promise<PriceTableItem> {
    let item = await this.priceTableItemsRepository.findOne({
      where: { productId, priceTableId },
    });

    if (!item) {
      item = await this.priceTableItemsRepository.create({
        productId,
        priceTableId,
        manualPrice,
        isManual: true,
      });
    } else {
      item.manualPrice = manualPrice;
      item.isManual = true;
      await item.save();
    }

    return item;
  }
}
