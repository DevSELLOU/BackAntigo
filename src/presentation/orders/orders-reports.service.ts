import { Inject, Injectable } from '@nestjs/common';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { CompaniesService } from 'src/companies/companies.service';
import { DashboardDTO } from 'src/dashboard/dtos/dashboard.dto';
import { OrdersReportDto } from 'src/dashboard/dtos/orders-report.dto';
import { ProductCustomerDto, ProductsReportDto } from 'src/dashboard/dtos/products-report.dto';
import { SalesByVendorReportDto } from 'src/dashboard/dtos/sales-by-vendor-report.dto';
import { Customer } from 'src/presentation/customers/customer.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { Order } from '../orders/order.entity';
import { PaymentCondition } from '../payment-conditions/payment-condition.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock-movement/stock-movement.entity';
import { StockMovementType } from '../stock-movement/enums/stock-movement-type.enum';
import { User } from 'src/users/user.entity';
import { parseMonthYearFilters } from './parse-month-year-filters';

@Injectable()
export class OrdersReportsService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject('ORDER_REPOSITORY')
    private readonly ordersRepository: typeof Order,
    @Inject('ORDER_ITEM_REPOSITORY')
    private readonly orderItemsRepository: typeof OrderItem,
    @Inject('STOCK_MOVEMENT_REPOSITORY')
    private readonly stockMovementRepository: typeof StockMovement,
  ) {}

  async generateSalesByVendorReport(
    data: DashboardDTO,
  ): Promise<SalesByVendorReportDto[]> {
    const { companyId } = data;

    await this.companiesService.findOne(companyId);

    const whereConditions: WhereOptions = {
      companyId,
      ...this.buildDateWhereClause(data),
    };

    const results = await this.ordersRepository.findAll({
      attributes: [
        [Sequelize.col('responsibleUser.id'), 'vendorId'],
        [Sequelize.col('responsibleUser.name'), 'vendorName'],
        [
          Sequelize.fn('to_char', Sequelize.col('Order.createdAt'), 'YYYY'),
          'year',
        ],
        [
          Sequelize.fn('to_char', Sequelize.col('Order.createdAt'), 'MM'),
          'month',
        ],
        [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'orderCount'],
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn('SUM', Sequelize.col('Order.totalValue')),
            0,
          ),
          'totalValue',
        ],
        [
          Sequelize.literal('COALESCE(SUM("orderItems"."quantity"), 0)'),
          'totalItems',
        ],
      ],
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'responsibleUser',
          required: true,
          attributes: [],
        },
        {
          model: OrderItem,
          required: false,
          attributes: [],
        },
      ],
      group: [
        'responsibleUser.id',
        'responsibleUser.name',
        Sequelize.fn('to_char', Sequelize.col('Order.createdAt'), 'YYYY'),
        Sequelize.fn('to_char', Sequelize.col('Order.createdAt'), 'MM'),
      ],
      order: [
        [Sequelize.literal('"vendorName"'), 'ASC'],
        [Sequelize.literal('"year"'), 'ASC'],
        [Sequelize.literal('"month"'), 'ASC'],
      ],
      raw: true,
    });

    return (results as any[]).map((r) => ({
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      year: parseInt(r.year, 10),
      month: parseInt(r.month, 10),
      orderCount: parseInt(r.orderCount, 10),
      totalValue: parseFloat(r.totalValue.toString()),
      totalItems: parseInt(r.totalItems, 10),
    }));
  }

  async generateProductsReport(
    data: DashboardDTO,
  ): Promise<ProductsReportDto[]> {
    const { companyId, products } = data;

    await this.companiesService.findOne(companyId);

    const dateWhere = this.buildDateWhereClause(data);

    const whereConditions: WhereOptions = {
      companyId,
      ...dateWhere,
    };

    const productIdsFilter =
      products && products.length > 0
        ? products.map((p) => Number(p)).filter((id) => !isNaN(id) && id > 0)
        : undefined;

    const results = await this.orderItemsRepository.findAll({
      attributes: [
        [Sequelize.col('product.id'), 'productId'],
        [Sequelize.col('product.name'), 'productName'],
        [Sequelize.col('product.brand'), 'brand'],
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn('SUM', Sequelize.col('OrderItem.quantity')),
            0,
          ),
          'totalQuantitySold',
        ],
        [
          Sequelize.literal(
            'COALESCE(SUM("OrderItem"."quantity" * "product"."price"), 0)',
          ),
          'totalRevenue',
        ],
      ],
      where: {
        ...(productIdsFilter && productIdsFilter.length > 0
          ? { productId: { [Op.in]: productIdsFilter } }
          : {}),
      },
      include: [
        {
          model: Product,
          as: 'product',
          required: true,
          attributes: [],
        },
        {
          model: Order,
          as: 'order',
          required: true,
          attributes: [],
          where: whereConditions,
        },
      ],
      group: ['product.id', 'product.name', 'product.brand'],
      order: [[Sequelize.literal('"totalQuantitySold"'), 'DESC']],
      raw: true,
    });

    const returnedProductIds = (results as any[]).map((r) => r.productId);
    const stockMap = await this.getStockMapForProducts(returnedProductIds);

    const { periodStart, periodEnd } = this.resolvePeriodBounds(data);

    return (results as any[]).map((r) => ({
      productId: r.productId,
      productName: r.productName,
      brand: r.brand,
      totalQuantitySold: parseInt(r.totalQuantitySold, 10),
      totalRevenue: parseFloat(r.totalRevenue.toString()),
      currentStock: stockMap.get(r.productId) ?? 0,
      periodStart,
      periodEnd,
    }));
  }

  async getProductCustomers(
    companyId: number,
    productId: number,
    months?: string[],
    years?: string[],
  ): Promise<ProductCustomerDto[]> {
    const dateWhere = this.buildDateWhereClause({ companyId, months, years });

    const orderItems = await this.orderItemsRepository.findAll({
      where: { productId },
      include: [
        {
          model: Product,
          required: true,
        },
        {
          model: Order,
          required: true,
          where: { companyId, ...dateWhere },
          include: [
            {
              model: Customer,
              required: true,
            },
          ],
        },
      ],
    });

    const customerMap = new Map<number, ProductCustomerDto>();

    for (const item of orderItems) {
      const customer = (item as any).order.customer;
      if (!customer) continue;

      const customerId = customer.id;
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId: customer.id,
          customerName: customer.fantasyName || customer.corporateName || 'N/A',
          customerDocument: customer.document || '—',
          totalQuantity: 0,
          totalSpent: 0,
          lastPurchaseDate: null,
        });
      }

      const entry = customerMap.get(customerId)!;
      const qty = Number(item.quantity) || 0;
      const price = Number((item as any).product?.price) || 0;
      const discount = Number((item as any).discount) || 0;
      entry.totalQuantity += qty;
      entry.totalSpent += qty * price - discount;

      const orderDate = (item as any).order?.createdAt;
      if (orderDate && (!entry.lastPurchaseDate || new Date(orderDate) > new Date(entry.lastPurchaseDate))) {
        entry.lastPurchaseDate = new Date(orderDate).toISOString();
      }
    }

    return Array.from(customerMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }

  async generateOrdersReport(data: DashboardDTO): Promise<OrdersReportDto[]> {
    const { companyId } = data;

    await this.companiesService.findOne(companyId);

    const whereConditions: WhereOptions = {
      companyId,
      ...this.buildDateWhereClause(data),
    };

    const orders = await this.ordersRepository.findAll({
      where: whereConditions,
      include: [
        {
          model: Customer,
          required: true,
        },
        {
          model: OrderItem,
          required: true,
        },
        {
          model: PaymentCondition,
          required: true,
        },
      ],
    });

    return orders.map((order) => {
      return {
        orderId: order.id,
        orderStatus: order.status,
        totalValue: Number(order.totalValue),
        createdAt: order.createdAt ? order.createdAt.toISOString() : '',
        customerName:
          order.customer?.fantasyName || order.customer?.corporateName || 'N/A',
        customerDocument: order.customer?.document,
        customerSegment: order.customer?.segment,
        customerUF: order.customer?.UF,
        customerGroup: order.customer?.customerGroupCode,
        paymentCondition: order.paymentCondition?.name,
        amountPaid: Number(order.amountPaid),
        discount: Number(order.discount),
        itemsCount: (order.orderItems || []).length,
        itemsTotalValue: (order.orderItems || []).reduce(
          (sum, item) =>
            sum +
            Number(item.quantity) * Number(item.product?.price ?? 0) -
            Number(item.discount ?? 0),
          0,
        ),
      };
    });
  }

  private buildDateWhereClause(filter: DashboardDTO): WhereOptions {
    return parseMonthYearFilters(filter).dateWhere;
  }

  private resolvePeriodBounds(data: DashboardDTO): {
    periodStart: string | null;
    periodEnd: string | null;
  } {
    const { monthRanges, yearRanges } = parseMonthYearFilters(data);
    const dates: Date[] = [];

    for (const [start, end] of monthRanges) {
      dates.push(start);
      dates.push(end);
    }
    for (const [start, end] of yearRanges) {
      dates.push(start);
      dates.push(end);
    }

    if (dates.length === 0) {
      return { periodStart: null, periodEnd: null };
    }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const toIsoDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      periodStart: toIsoDate(minDate),
      periodEnd: toIsoDate(maxDate),
    };
  }

  private async getStockMapForProducts(
    productIds: number[],
  ): Promise<Map<number, number>> {
    const stockMap = new Map<number, number>();

    if (!productIds || productIds.length === 0) {
      return stockMap;
    }

    const rows = await this.stockMovementRepository.findAll({
      attributes: [
        'productId',
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn(
              'SUM',
              Sequelize.literal(
                `CASE WHEN type = '${StockMovementType.In}' THEN quantity ELSE 0 END`,
              ),
            ),
            0,
          ),
          'stockIn',
        ],
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn(
              'SUM',
              Sequelize.literal(
                `CASE WHEN type = '${StockMovementType.Out}' THEN quantity ELSE 0 END`,
              ),
            ),
            0,
          ),
          'stockOut',
        ],
      ],
      where: { productId: { [Op.in]: productIds } },
      group: ['productId'],
      raw: true,
    });

    for (const row of rows as any[]) {
      const productId = row.productId;
      const stockIn = parseInt(row.stockIn, 10) || 0;
      const stockOut = parseInt(row.stockOut, 10) || 0;
      stockMap.set(productId, stockIn - stockOut);
    }

    return stockMap;
  }
}
