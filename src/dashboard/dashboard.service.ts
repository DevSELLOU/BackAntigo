import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { fn, col, Op, WhereOptions, literal } from 'sequelize';
import { Customer } from 'src/presentation/customers/customer.entity';
import { OrderItem } from 'src/presentation/order-items/order-item.entity';
import { PaymentCondition } from 'src/presentation/payment-conditions/payment-condition.entity';
import { PaymentMethod } from 'src/presentation/payment-methods/payment-method.entity';
import { Product } from 'src/presentation/products/entities/product.entity';
import { SubCategory } from 'src/presentation/sub-categories/sub-category.entity';
import { OrdersService } from 'src/presentation/orders/orders.service';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { DashboardDTO } from './dtos/dashboard.dto';
import { Order } from 'src/presentation/orders/order.entity';
import { Company } from 'src/companies/company.entity';
import { CompanyStatus } from 'src/companies/enums/company-status.enum';
import {
  OrderStatus,
  ACTIVE_ORDER_STATUSES,
  INVOICED_ORDER_STATUSES,
} from 'src/presentation/orders/enums/order-status.enum';
import { City } from 'src/cities/city.entity';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(OrdersService)
    private readonly ordersService: OrdersService,
  ) {}

  private _buildCustomerWhereClause(filter: DashboardDTO): WhereOptions {
    const where: WhereOptions = {};
    if (filter.state && filter.state.length > 0) {
      where.UF = { [Op.in]: filter.state };
    }
    if (filter.cities && filter.cities.length > 0) {
      where.city = { [Op.in]: filter.cities };
    }
    if (filter.customers && filter.customers.length > 0) {
      where.id = { [Op.in]: filter.customers };
    }
    return where;
  }

  private _buildProductWhereClause(filter: DashboardDTO): WhereOptions {
    const where: WhereOptions = {};
    if (filter.products && filter.products.length > 0) {
      where.name = { [Op.in]: filter.products };
    }
    return where;
  }

  private _buildDateWhereClause(
    filter: DashboardDTO,
    modelAlias: string = 'Order',
  ): WhereOptions {
    const { months, years } = filter;
    const where: any = {};
    const dateConditions = [];

    if (months && months.length > 0) {
      const monthConditions = months.map((monthStr) => {
        const [year, month] = monthStr.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
          throw new BadRequestException(
            `Invalid month format in months parameter: ${monthStr}`,
          );
        }
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        return {
          [`$${modelAlias}.createdAt$`]: {
            [Op.between]: [startDate, endDate],
          },
        };
      });
      dateConditions.push(...monthConditions);
    }

    if (years && years.length > 0) {
      const yearConditions = years.map((yearStr) => {
        const year = Number(yearStr);
        if (isNaN(year)) {
          throw new BadRequestException(
            `Invalid year format in years parameter: ${yearStr}`,
          );
        }
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        return {
          [`$${modelAlias}.createdAt$`]: { [Op.between]: [startDate, endDate] },
        };
      });
      dateConditions.push(...yearConditions);
    }

    if (dateConditions.length > 0) {
      where[Op.or] = dateConditions;
    }

    return where;
  }

  private _buildBaseWhereClause(
    filter: DashboardDTO,
    alias: string = 'Order',
  ): WhereOptions {
    const where: WhereOptions = {
      companyId: filter.companyId,
      ...this._buildDateWhereClause(filter, alias),
    };

    if (filter.sellers && filter.sellers.length > 0) {
      where.responsibleUserId = { [Op.in]: filter.sellers };
    }

    if (filter.managers && filter.managers.length > 0) {
      where.managerId = { [Op.in]: filter.managers };
    }

    return where;
  }

  private _buildFullCustomerWhereClause(filter: DashboardDTO): WhereOptions {
    return {
      companyId: filter.companyId,
      ...this._buildDateWhereClause(filter, 'Customer'),
      ...this._buildCustomerWhereClause(filter),
    };
  }

  private async _baseQuery(filter: DashboardDTO, options: any = {}) {
    const customerWhere = this._buildCustomerWhereClause(filter);
    const productWhere = this._buildProductWhereClause(filter);

    const queryOptions = {
      where: this._buildBaseWhereClause(filter),
      include: [
        {
          model: Customer,
          as: 'customer',
          where: customerWhere,
          required: true,
          attributes: [],
        },
        { model: User, as: 'responsibleUser', attributes: [] },
        {
          model: OrderItem,
          as: 'orderItems',
          required: !!(filter.products && filter.products.length > 0),
          attributes: [],
          include: [
            {
              model: Product,
              where: productWhere,
              as: 'product',
              attributes: [],
              include: [
                {
                  model: SubCategory,
                  as: 'subCategories',
                  attributes: [],
                  through: { attributes: [] },
                },
              ],
            },
          ],
        },
        { model: PaymentCondition, as: 'paymentCondition', attributes: [] },
        { model: PaymentMethod, as: 'paymentMethod', attributes: [] },
      ],
      ...options,
    };

    if (options.include) {
      const finalIncludes = [...queryOptions.include];
      options.include.forEach((overrideInc) => {
        const existingIndex = finalIncludes.findIndex(
          (inc) => inc.model === overrideInc.model && inc.as === overrideInc.as,
        );
        if (existingIndex > -1) {
          finalIncludes[existingIndex] = overrideInc;
        } else {
          finalIncludes.push(overrideInc);
        }
      });
      queryOptions.include = finalIncludes;
      delete options.include;
    }

    return this.ordersService.getModel().findAll(queryOptions);
  }

  async getNumberOfActiveCompanies() {
    return Company.count({
      where: { status: CompanyStatus.Active },
    });
  }

  async getNumberOfActiveUsers() {
    return this.usersService.getNumberOfActiveUsers();
  }

  async getTotalOrdersValue() {
    return this.ordersService.getTotalOrdersValue();
  }

  async getTotalOrders() {
    return this.ordersService.getTotalOrders();
  }

  async getAverageOrderValue() {
    return this.ordersService.getAverageOrderValue();
  }

  async getRevenueChartByCompany() {
    return this.ordersService.getRevenueByCompany();
  }

  async getOrdersChartByCompany() {
    return this.ordersService.getOrdersByCompany();
  }

  async getOrdersChartByDay() {
    return this.ordersService.getOrdersByDay();
  }

  async getRevenueChartByDay() {
    return this.ordersService.getRevenueByDay();
  }

  //Companies

  async getCompanyRevenue(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [[fn('SUM', col('totalValue')), 'totalRevenue']],
      raw: true,
      group: [],
    });

    return orders.length > 0 ? parseFloat((orders[0] as any).totalRevenue) : 0;
  }

  async getCompanyInvoices(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [[fn('SUM', col('totalValue')), 'totalRevenue']],
      raw: true,
      group: [],
    });

    return orders.length > 0 ? parseFloat((orders[0] as any).totalRevenue) : 0;
  }

  async getCompanyReturns(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: OrderStatus.Returned,
      },
      attributes: [[fn('SUM', col('totalValue')), 'totalRevenue']],
      raw: true,
      group: [],
    });
    return orders.length > 0 ? parseFloat((orders[0] as any).totalRevenue) : 0;
  }
  async getCompanyActiveUsers(data: DashboardDTO) {
    return this.usersService.getCompanyActiveUsers(data);
  }

  async getCompanyTotalCustomers(data: DashboardDTO) {
    const customerWhere = this._buildFullCustomerWhereClause(data);
    return Customer.count({ where: customerWhere });
  }

  async getCompanyTotalActiveCustomers(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [col('Order.customerId')],
      group: [col('Order.customerId')],
      raw: true,
    });
    return orders.length;
  }

  async getCompanyTotalInactiveCustomers(data: DashboardDTO) {
    const { companyId, state, cities } = data;

    return Customer.count({
      include: [
        {
          model: Order,
          attributes: [],
          required: false,
          as: 'orders',
          where: this._buildBaseWhereClause(data, 'orders'),
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
  }

  async getCompanyTotalCitiesWithoutOrders(data: DashboardDTO) {
    const { companyId, state, cities } = data;

    const conditions: string[] = [];
    const replacements: any = { companyId };

    if (state && state.length > 0) {
      conditions.push(`c."stateAbbreviation" IN (:states)`);
      replacements.states = state;
    }

    if (cities && cities.length > 0) {
      conditions.push(`c.name IN (:cities)`);
      replacements.cities = cities;
    }

    const whereClause =
      conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const customerCitiesResult = await Order.sequelize.query(
      `SELECT DISTINCT c.name, c."stateAbbreviation"
       FROM "Cities" c
       INNER JOIN "Customers" cust ON cust.city = c.name AND cust."UF" = c."stateAbbreviation"
       WHERE cust."companyId" = :companyId
       ${whereClause}`,
      { replacements, type: 'SELECT' },
    );

    const customerCities = Array.isArray(customerCitiesResult)
      ? (customerCitiesResult as any[])
      : [];
    if (customerCities.length === 0) return 0;

    // Get date conditions
    let dateConditions = '';
    const dateWhere = this._buildDateWhereClause(data, 'o');
    const dateOr = (dateWhere as any)[Op.or];
    if (dateOr && Array.isArray(dateOr)) {
      dateConditions = dateOr
        .map((cond) => {
          const key = Object.keys(cond)[0];
          const between = cond[key]?.[Op.between];
          if (!between) return '';
          return `AND o."createdAt" BETWEEN '${between[0].toISOString()}' AND '${between[1].toISOString()}'`;
        })
        .join(' ');
    }

    let sellerCondition = '';
    if (data.sellers && data.sellers.length > 0) {
      sellerCondition = `AND o."responsibleUserId" IN (:sellers)`;
      replacements.sellers = data.sellers;
    }

    if (data.managers && data.managers.length > 0) {
      sellerCondition += ` AND o."managerId" IN (:managers)`;
      replacements.managers = data.managers;
    }

    const salesCitiesResult = await Order.sequelize.query(
      `SELECT DISTINCT c.name, c."stateAbbreviation"
       FROM "Cities" c
       INNER JOIN "Customers" cust ON cust.city = c.name AND cust."UF" = c."stateAbbreviation"
       INNER JOIN "Orders" o ON o."customerId" = cust.id AND o."companyId" = cust."companyId"
       WHERE cust."companyId" = :companyId
         AND o.status IN (:statuses)
         ${dateConditions}
         ${sellerCondition}
       ${whereClause}`,
      {
        replacements: {
          ...replacements,
          statuses: INVOICED_ORDER_STATUSES,
        },
        type: 'SELECT',
      },
    );

    const salesCities = Array.isArray(salesCitiesResult)
      ? (salesCitiesResult as any[])
      : [];
    const salesSet = new Set(
      salesCities.map((c) => `${c.name}|${c.stateAbbreviation}`),
    );

    return customerCities.filter(
      (c) => !salesSet.has(`${c.name}|${c.stateAbbreviation}`),
    ).length;
  }

  async getCompanyNewCustomers(data: DashboardDTO) {
    const customerWhere = this._buildFullCustomerWhereClause(data);
    return Customer.count({
      where: customerWhere,
    });
  }

  async getCompanyTotalNewCustomers(data: DashboardDTO) {
    const customerCreationWhere = this._buildDateWhereClause(data, 'customer');

    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [[fn('SUM', col('totalValue')), 'totalRevenue']],
      include: [
        {
          model: Customer,
          as: 'customer',
          where: {
            ...this._buildCustomerWhereClause(data),
            ...customerCreationWhere,
          },
          required: true,
          attributes: [],
        },
      ],
      raw: true,
      group: [],
    });

    return orders.length > 0 ? parseFloat((orders[0] as any).totalRevenue) : 0;
  }
  async getCompanyAverageTicket(data: DashboardDTO) {
    const result = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [[fn('AVG', col('totalValue')), 'averageTicket']],
      raw: true,
      group: [],
    });

    if (result.length > 0 && (result[0] as any).averageTicket) {
      return parseFloat((result[0] as any).averageTicket);
    }

    return 0;
  }

  async getCompanyOrdersOverTime(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [
        [fn('to_char', col('Order.createdAt'), 'YYYY-MM'), 'label'],
        [fn('COUNT', col('Order.id')), 'orders'],
      ],
      group: [fn('to_char', col('Order.createdAt'), 'YYYY-MM')],
      order: [[fn('to_char', col('Order.createdAt'), 'YYYY-MM'), 'ASC']],
      raw: true,
      subQuery: false,
    });

    return (results as any[]).map((item) => ({
      label: item.label,
      orders: parseInt(item.orders, 10),
    }));
  }

  async getCompanyRevenueOverTime(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [
        [fn('to_char', col('Order.createdAt'), 'YYYY-MM'), 'label'],
        [fn('SUM', col('totalValue')), 'totalRevenue'],
      ],
      group: [fn('to_char', col('Order.createdAt'), 'YYYY-MM')],
      order: [[fn('to_char', col('Order.createdAt'), 'YYYY-MM'), 'ASC']],
      raw: true,
      subQuery: false,
    });

    return (results as any[]).map((item) => ({
      label: item.label,
      totalRevenue: parseFloat(item.totalRevenue || 0),
    }));
  }

  async getCompanyCustomersWithOrderPerMonth(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [
        [fn('to_char', col('Order.createdAt'), 'YYYY-MM'), 'label'],
        [fn('COUNT', fn('DISTINCT', col('Order.customerId'))), 'orders'],
      ],
      group: [fn('to_char', col('Order.createdAt'), 'YYYY-MM')],
      order: [[fn('to_char', col('Order.createdAt'), 'YYYY-MM'), 'ASC']],
      raw: true,
      subQuery: false,
    });

    return (results as any[]).map((item) => ({
      label: item.label,
      orders: parseInt(item.orders, 10),
    }));
  }

  async getCompanyOrdersByProductCategory(data: DashboardDTO) {
    const queryOptions = {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [
        [col('orderItems.product.subCategories.name'), 'label'],
        [fn('COUNT', literal('DISTINCT "Order"."id"')), 'orders'],
      ],
      group: [col('orderItems.product.subCategories.name')],
      raw: true,
      subQuery: false,
    };

    const results = await this._baseQuery(data, queryOptions);

    return (results as any[]).map((item) => ({
      ...item,
      orders: parseInt(item.orders, 10) || 0,
    }));
  }

  async getCompanyOrdersByPaymentCondition(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [
        [col('paymentCondition.name'), 'label'],
        [fn('COUNT', col('Order.id')), 'orders'],
      ],
      group: [col('paymentCondition.name')],
      raw: true,
      subQuery: false,
    });

    return (results as any[]).map((item) => ({
      ...item,
      orders: parseInt(item.orders, 10),
    }));
  }

  async getCompanyOrdersByValueRange(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: ['totalValue'],
      raw: true,
    });

    const ordersByValueRange = (orders as any[]).reduce((acc, order) => {
      const totalValue = parseFloat(order.totalValue);
      let label: string;

      if (totalValue < 100) {
        label = '0-99';
      } else if (totalValue >= 100 && totalValue <= 499) {
        label = '100-499';
      } else if (totalValue >= 500 && totalValue <= 999) {
        label = '500-999';
      } else {
        label = '1000+';
      }

      const existingGroup = acc.find((item) => item.label === label);
      if (existingGroup) {
        existingGroup.orders += 1;
      } else {
        acc.push({ label, orders: 1 });
      }

      return acc;
    }, []);

    ordersByValueRange.sort((a, b) => a.label.localeCompare(b.label));

    return ordersByValueRange;
  }

  async getCompanyProductsByRevenue(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [
        [col('orderItems.product.name'), 'label'],
        [fn('SUM', col('totalValue')), 'totalRevenue'],
      ],
      group: [col('orderItems.product.name')],
      order: [[fn('SUM', col('totalValue')), 'DESC']],
      raw: true,
      subQuery: false,
    });

    return (results as any[]).map((item) => ({
      label: item.label,
      totalRevenue: parseFloat(item.totalRevenue || 0),
    }));
  }

  async getCompanyAverageOrdersPerCustomer(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [
        [col('customer.corporateName'), 'label'],
        [fn('COUNT', col('Order.id')), 'orders'],
      ],
      group: [col('customer.corporateName')],
      order: [[col('customer.corporateName'), 'ASC']],
      raw: true,
      subQuery: false,
    });

    return (results as any[]).map((item) => ({
      label: item.label,
      orders: parseInt(item.orders, 10),
    }));
  }

  async getCompanyAverageMixItems(data: DashboardDTO) {
    const result = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [
        [fn('COUNT', col('Order.id')), 'totalItems'],
        [fn('COUNT', fn('DISTINCT', col('Order.id'))), 'totalOrders'],
      ],
      raw: true,
      group: [],
    });

    if (!result || result.length === 0) {
      return 0;
    }

    const stats = result[0] as any;
    const totalItems = parseInt(stats.totalItems, 10) || 0;
    const totalOrders = parseInt(stats.totalOrders, 10) || 0;

    if (totalOrders === 0) {
      return 0;
    }

    return parseFloat((totalItems / totalOrders).toFixed(2));
  }

  async getCompanyCanceledOrders(data: DashboardDTO) {
    const result = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: OrderStatus.Canceled,
      },
      attributes: [[fn('SUM', col('totalValue')), 'totalCanceled']],
      raw: true,
      group: [],
    });

    if (result.length > 0 && (result[0] as any).totalCanceled) {
      return parseFloat((result[0] as any).totalCanceled);
    }

    return 0;
  }

  async getCompanyAverageTimeBetweenOrders(data: DashboardDTO) {
    const allOrders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: ['customerId', 'createdAt'],
      order: [
        ['customerId', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      raw: true,
    });

    if (allOrders.length <= 1) {
      return 0;
    }

    let totalTimeDifferenceMs = 0;
    let numberOfIntervals = 0;
    let lastOrderTimestamp: number | null = null;
    let lastCustomerId: number | null = null;

    for (const order of allOrders as any[]) {
      const currentCustomerId = order.customerId;
      const currentOrderTimestamp = new Date(order.createdAt).getTime();

      if (
        lastCustomerId !== null &&
        lastCustomerId === currentCustomerId &&
        lastOrderTimestamp !== null
      ) {
        const timeDifferenceMs = currentOrderTimestamp - lastOrderTimestamp;
        totalTimeDifferenceMs += timeDifferenceMs;
        numberOfIntervals++;
      }

      lastCustomerId = currentCustomerId;
      lastOrderTimestamp = currentOrderTimestamp;
    }

    if (numberOfIntervals === 0) {
      return 0;
    }

    const averageTimeMs = totalTimeDifferenceMs / numberOfIntervals;
    const millisecondsInDay = 1000 * 60 * 60 * 24;
    const averageTimeDays = averageTimeMs / millisecondsInDay;

    return Math.ceil(averageTimeDays);
  }

  async getCompanyInvoiceConversion(data: DashboardDTO) {
    const allOrdersResult = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.notIn]: [
            OrderStatus.Canceled,
            OrderStatus.Blocked,
            OrderStatus.Returned,
          ],
        },
      },
      attributes: [[fn('COUNT', col('Order.id')), 'count']],
      raw: true,
      group: [],
    });

    const invoicedOrdersResult = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: {
          [Op.in]: INVOICED_ORDER_STATUSES,
        },
      },
      attributes: [[fn('COUNT', col('Order.id')), 'count']],
      raw: true,
      group: [],
    });

    const totalOrders =
      allOrdersResult.length > 0
        ? parseInt((allOrdersResult[0] as any).count, 10)
        : 0;
    const invoicedOrders =
      invoicedOrdersResult.length > 0
        ? parseInt((invoicedOrdersResult[0] as any).count, 10)
        : 0;

    if (totalOrders === 0) {
      return 0;
    }

    const percentage = (invoicedOrders * 100) / totalOrders;
    return parseFloat(percentage.toFixed(2));
  }

  async getCompanyReactivatedCustomersCount(data: DashboardDTO) {
    const { months, years } = data;

    let recentStartDate: Date, recentEndDate: Date;

    if (months?.length > 0 || years?.length > 0) {
      const dateWhereClause = this._buildDateWhereClause(data);
      const orConditions = dateWhereClause[Op.or] as {
        [key: string]: { [Op.between]: Date[] };
      }[];

      if (!orConditions || orConditions.length === 0) {
        return 0;
      }

      const allDates = orConditions.flatMap((condition) => {
        const createdAtKey = Object.keys(condition).find((key) =>
          key.includes('createdAt'),
        );
        if (
          createdAtKey &&
          condition[createdAtKey] &&
          condition[createdAtKey][Op.between]
        ) {
          return condition[createdAtKey][Op.between];
        }
        return [];
      });
      if (allDates.length === 0) {
        return 0;
      }
      recentStartDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      recentEndDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
    } else {
      recentEndDate = new Date();
      recentStartDate = new Date(recentEndDate);
      recentStartDate.setDate(recentEndDate.getDate() - 90);
    }

    const inactiveEndDate = new Date(recentStartDate);
    const inactiveStartDate = new Date(inactiveEndDate);
    inactiveStartDate.setDate(inactiveEndDate.getDate() - 90);

    const activeCustomersInInactivePeriod = await this.ordersService
      .getModel()
      .findAll({
        where: {
          companyId: data.companyId,
          createdAt: { [Op.between]: [inactiveStartDate, inactiveEndDate] },
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            where: this._buildCustomerWhereClause(data),
            attributes: [],
            required: true,
          },
        ],
        attributes: [[fn('DISTINCT', col('customerId')), 'customerId']],
        raw: true,
      });
    const activeCustomerIds = activeCustomersInInactivePeriod.map(
      (c: any) => c.customerId,
    );

    const reactivatedCustomers = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        customerId: { [Op.notIn]: activeCustomerIds },
        '$customer.createdAt$': { [Op.lt]: inactiveStartDate },
      },
      attributes: [
        [fn('COUNT', fn('DISTINCT', col('Order.customerId'))), 'count'],
      ],
      raw: true,
      group: [],
    });

    return reactivatedCustomers.length > 0
      ? parseInt((reactivatedCustomers[0] as any).count, 10)
      : 0;
  }

  async getCompanyReactivatedCustomersTotalValue(data: DashboardDTO) {
    const { months, years } = data;

    let recentStartDate: Date;

    if (months?.length > 0 || years?.length > 0) {
      const dateWhereClause = this._buildDateWhereClause(data);
      const orConditions = dateWhereClause[Op.or] as {
        [key: string]: { [Op.between]: Date[] };
      }[];

      if (!orConditions || orConditions.length === 0) {
        return 0;
      }

      const allDates = orConditions.flatMap((condition) => {
        const createdAtKey = Object.keys(condition).find((key) =>
          key.includes('createdAt'),
        );
        if (
          createdAtKey &&
          condition[createdAtKey] &&
          condition[createdAtKey][Op.between]
        ) {
          return condition[createdAtKey][Op.between];
        }
        return [];
      });
      if (allDates.length === 0) {
        return 0;
      }
      recentStartDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    } else {
      const recentEndDate = new Date();
      recentStartDate = new Date(recentEndDate);
      recentStartDate.setDate(recentEndDate.getDate() - 90);
    }

    const inactiveEndDate = new Date(recentStartDate);
    const inactiveStartDate = new Date(inactiveEndDate);
    inactiveStartDate.setDate(inactiveEndDate.getDate() - 90);

    const activeCustomersInInactivePeriod = await this.ordersService
      .getModel()
      .findAll({
        where: {
          companyId: data.companyId,
          createdAt: { [Op.between]: [inactiveStartDate, inactiveEndDate] },
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            where: this._buildCustomerWhereClause(data),
            attributes: [],
            required: true,
          },
        ],
        attributes: [[fn('DISTINCT', col('customerId')), 'customerId']],
        raw: true,
      });
    const activeCustomerIds = activeCustomersInInactivePeriod.map(
      (c: any) => c.customerId,
    );

    const reactivatedResult = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        customerId: { [Op.notIn]: activeCustomerIds },
        '$customer.createdAt$': { [Op.lt]: inactiveStartDate },
      },
      attributes: [[fn('SUM', col('totalValue')), 'totalValue']],
      raw: true,
      group: [],
    });

    return reactivatedResult.length > 0
      ? parseFloat((reactivatedResult[0] as any).totalValue || 0)
      : 0;
  }

  async getCompanyInactiveToReactivatedRatio(data: DashboardDTO) {
    const { months, years } = data;

    let recentStartDate: Date;

    if (months?.length > 0 || years?.length > 0) {
      const dateWhereClause = this._buildDateWhereClause(data);
      const orConditions = dateWhereClause[Op.or] as {
        [key: string]: { [Op.between]: Date[] };
      }[];

      if (!orConditions || orConditions.length === 0) {
        return 0;
      }

      const allDates = orConditions.flatMap((condition) => {
        const createdAtKey = Object.keys(condition).find((key) =>
          key.includes('createdAt'),
        );
        if (
          createdAtKey &&
          condition[createdAtKey] &&
          condition[createdAtKey][Op.between]
        ) {
          return condition[createdAtKey][Op.between];
        }
        return [];
      });
      if (allDates.length === 0) {
        return 0;
      }
      recentStartDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    } else {
      const recentEndDate = new Date();
      recentStartDate = new Date(recentEndDate);
      recentStartDate.setDate(recentEndDate.getDate() - 90);
    }

    const inactiveEndDate = new Date(recentStartDate);
    const inactiveStartDate = new Date(inactiveEndDate);
    inactiveStartDate.setDate(inactiveEndDate.getDate() - 90);

    const customerWhere = this._buildCustomerWhereClause(data);

    const activeCustomersInInactivePeriod = await this.ordersService
      .getModel()
      .findAll({
        where: {
          companyId: data.companyId,
          createdAt: { [Op.between]: [inactiveStartDate, inactiveEndDate] },
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            where: customerWhere,
            attributes: [],
            required: true,
          },
        ],
        attributes: [[fn('DISTINCT', col('customerId')), 'customerId']],
        raw: true,
      });
    const activeCustomerIds = activeCustomersInInactivePeriod.map(
      (c: any) => c.customerId,
    );

    const totalCustomersBeforeInactivePeriod = await Customer.count({
      where: {
        companyId: data.companyId,
        ...customerWhere,
        createdAt: { [Op.lt]: inactiveStartDate },
      },
    });

    const totalInactiveCustomers =
      totalCustomersBeforeInactivePeriod - activeCustomerIds.length;

    const reactivatedCustomersCount =
      await this.getCompanyReactivatedCustomersCount(data);

    if (totalInactiveCustomers <= 0) return 0;

    const ratio = (reactivatedCustomersCount / totalInactiveCustomers) * 100;
    return parseFloat(ratio.toFixed(2));
  }

  async getCompanyTotalInApprovalOrders(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: OrderStatus.InApproval,
      },
      attributes: [[fn('SUM', col('totalValue')), 'totalRevenue']],
      raw: true,
      group: [],
    });
    return orders.length > 0 ? parseFloat((orders[0] as any).totalRevenue) : 0;
  }

  async getCompanyTotalApprovedOrders(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: OrderStatus.Approved,
      },
      attributes: [[fn('SUM', col('totalValue')), 'totalRevenue']],
      raw: true,
      group: [],
    });
    return orders.length > 0 ? parseFloat((orders[0] as any).totalRevenue) : 0;
  }

  async getCompanyTotalOnBudgetOrders(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: OrderStatus.OnBudget,
      },
      attributes: [[fn('SUM', col('totalValue')), 'totalRevenue']],
      raw: true,
      group: [],
    });
    return orders.length > 0 ? parseFloat((orders[0] as any).totalRevenue) : 0;
  }

  async getCompanyTotalBlockedOrders(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: OrderStatus.Blocked,
      },
      attributes: [[fn('SUM', col('totalValue')), 'totalRevenue']],
      raw: true,
      group: [],
    });
    return orders.length > 0 ? parseFloat((orders[0] as any).totalRevenue) : 0;
  }
}
