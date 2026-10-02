import { Inject, Injectable } from '@nestjs/common';
import { fn, col, Op, literal, WhereOptions } from 'sequelize';
import { Customer } from 'src/presentation/customers/customer.entity';
import { OrderItem } from 'src/presentation/order-items/order-item.entity';
import { Product } from 'src/presentation/products/entities/product.entity';
import { OrdersService } from 'src/presentation/orders/orders.service';
import { User } from 'src/users/user.entity';
import { DashboardService } from './dashboard.service';
import { DashboardDTO } from './dtos/dashboard.dto';
import { Order } from 'src/presentation/orders/order.entity';
import {
  OrderStatus,
  INVOICED_ORDER_STATUSES,
} from 'src/presentation/orders/enums/order-status.enum';
import { City } from 'src/cities/city.entity';

const STATE_REGION_MAP: Record<string, string> = {
  AC: 'Norte',
  AL: 'Nordeste',
  AP: 'Norte',
  AM: 'Norte',
  BA: 'Nordeste',
  CE: 'Nordeste',
  DF: 'Centro-Oeste',
  ES: 'Sudeste',
  GO: 'Centro-Oeste',
  MA: 'Nordeste',
  MT: 'Centro-Oeste',
  MS: 'Centro-Oeste',
  MG: 'Sudeste',
  PA: 'Norte',
  PB: 'Nordeste',
  PR: 'Sul',
  PE: 'Nordeste',
  PI: 'Nordeste',
  RJ: 'Sudeste',
  RN: 'Nordeste',
  RS: 'Sul',
  RO: 'Norte',
  RR: 'Norte',
  SC: 'Sul',
  SP: 'Sudeste',
  SE: 'Nordeste',
  TO: 'Norte',
};

@Injectable()
export class DashboardTablesService {
  constructor(
    @Inject(DashboardService)
    private readonly dashboardService: DashboardService,
    @Inject(OrdersService)
    private readonly ordersService: OrdersService,
  ) {}

  private _baseQuery(data: DashboardDTO, options: any = {}) {
    return (this.dashboardService as any)._baseQuery(data, options);
  }

  private _buildBaseWhereClause(data: DashboardDTO, alias = 'Order') {
    return (this.dashboardService as any)._buildBaseWhereClause(data, alias);
  }

  private _buildCustomerWhereClause(data: DashboardDTO) {
    return (this.dashboardService as any)._buildCustomerWhereClause(data);
  }

  private _buildDateWhereClause(data: DashboardDTO, alias = 'Order') {
    return (this.dashboardService as any)._buildDateWhereClause(data, alias);
  }

  // --- GESTAO ---

  async getGestaoData(data: DashboardDTO) {
    const [
      revenue,
      orders,
      returns,
      averageTicket,
      activeCustomers,
      inactiveCustomers,
      activeUsers,
      revenueByRegion,
      topRepresentatives,
      topCollaborators,
    ] = await Promise.all([
      this.dashboardService.getCompanyRevenue(data),
      this.dashboardService.getCompanyInvoices(data),
      this.dashboardService.getCompanyReturns(data),
      this.dashboardService.getCompanyAverageTicket(data),
      this.dashboardService.getCompanyTotalActiveCustomers(data),
      this.dashboardService.getCompanyTotalInactiveCustomers(data),
      this.dashboardService.getCompanyActiveUsers(data),
      this._getRevenueByRegion(data),
      this._getTopRepresentatives(data),
      this._getTopCollaborators(data),
    ]);

    return {
      kpis: {
        revenue,
        orders,
        returns,
        averageTicket,
        activeCustomers,
        inactiveCustomers,
        activeUsers,
      },
      tables: { revenueByRegion, topRepresentatives, topCollaborators },
    };
  }

  // --- DINAMICO ---

  async getDinamicoData(data: DashboardDTO) {
    const [
      revenue,
      returns,
      invoices,
      averageTicket,
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalOrders,
    ] = await Promise.all([
      this.dashboardService.getCompanyRevenue(data),
      this.dashboardService.getCompanyReturns(data),
      this.dashboardService.getCompanyInvoices(data),
      this.dashboardService.getCompanyAverageTicket(data),
      this.dashboardService.getCompanyTotalCustomers(data),
      this.dashboardService.getCompanyTotalActiveCustomers(data),
      this.dashboardService.getCompanyTotalInactiveCustomers(data),
      this._getTotalOrderCount(data),
    ]);

    const [citiesAttended, resultsByRepresentative, resultsByCollaborator] =
      await Promise.all([
        this._getCitiesAttended(data),
        this._getResultsByRepresentative(data),
        this._getResultsByCollaborator(data),
      ]);

    return {
      kpis: {
        revenue,
        returns,
        invoices,
        averageTicket,
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        citiesAttended,
        totalOrders,
      },
      tables: { resultsByRepresentative, resultsByCollaborator },
    };
  }

  // --- FATURAMENTO ---

  async getFaturamentoData(data: DashboardDTO) {
    const [
      revenue,
      returns,
      averageTicket,
      totalCustomers,
      averageMixItems,
      revenueByRegion,
      revenueByMonth,
      revenueByState,
      topProducts,
      rankingClientes,
    ] = await Promise.all([
      this.dashboardService.getCompanyRevenue(data),
      this.dashboardService.getCompanyReturns(data),
      this.dashboardService.getCompanyAverageTicket(data),
      this.dashboardService.getCompanyTotalCustomers(data),
      this.dashboardService.getCompanyAverageMixItems(data),
      this._getRevenueByRegion(data),
      this._getRevenueByMonth(data),
      this._getRevenueByState(data),
      this._getTopProducts(data),
      this._getRankingClientes(data),
    ]);

    return {
      kpis: {
        revenue,
        returns,
        averageTicket,
        totalCustomers,
        averageMixItems,
      },
      tables: {
        revenueByRegion,
        revenueByMonth,
        revenueByState,
        topProducts,
        rankingClientes,
      },
    };
  }

  // --- PEDIDOS ---

  async getPedidosData(data: DashboardDTO) {
    const [
      invoices,
      approvedOrders,
      inApprovalOrders,
      blockedOrders,
      canceledOrders,
      onBudgetOrders,
      pedidosByRegion,
      topProducts,
      rankingClientes,
    ] = await Promise.all([
      this.dashboardService.getCompanyInvoices(data),
      this.dashboardService.getCompanyTotalApprovedOrders(data),
      this.dashboardService.getCompanyTotalInApprovalOrders(data),
      this.dashboardService.getCompanyTotalBlockedOrders(data),
      this.dashboardService.getCompanyCanceledOrders(data),
      this.dashboardService.getCompanyTotalOnBudgetOrders(data),
      this._getPedidosByRegion(data),
      this._getTopProducts(data),
      this._getRankingClientesPedidos(data),
    ]);

    return {
      kpis: {
        invoices,
        approvedOrders,
        inApprovalOrders,
        blockedOrders,
        canceledOrders,
        onBudgetOrders,
      },
      tables: { pedidosByRegion, topProducts, rankingClientes },
    };
  }

  // --- COBERTURA ---

  async getCoberturaData(data: DashboardDTO) {
    const [
      citiesWithSales,
      citiesWithoutSales,
      revenue,
      coveragePct,
      byRegion,
      byState,
      bySeller,
      byCollaborator,
      citiesWithSalesList,
      citiesWithoutSalesList,
    ] = await Promise.all([
      this._getCitiesWithSales(data),
      this._getCitiesWithoutSales(data),
      this.dashboardService.getCompanyRevenue(data),
      this._getCoveragePercentage(data),
      this._getCoberturaByRegion(data),
      this._getCoberturaByState(data),
      this._getCoberturaBySeller(data),
      this._getCoberturaByCollaborator(data),
      this._getCidadesComVenda(data),
      this._getCidadesSemVenda(data),
    ]);

    return {
      kpis: { citiesWithSales, citiesWithoutSales, revenue, coveragePct },
      tables: {
        byRegion,
        byState,
        bySeller,
        byCollaborator,
        citiesWithSalesList,
        citiesWithoutSalesList,
      },
    };
  }

  // --- CLIENTES ---

  async getClientesData(data: DashboardDTO) {
    const [
      totalCustomers,
      inactiveCustomers,
      activeCustomers,
      citiesWithoutFaturamento,
      purchaseCycle,
      newCustomerCount,
      newCustomerRevenue,
      conversionRate,
      reactivatedCount,
      reactivatedRevenue,
      reactivationRate,
      customersByChannel,
      customersByCity,
      inactive90Days,
      inactive90DaysByRep,
      inactive90DaysByColab,
      divisionBreakdown,
      customersByChannelDetails,
    ] = await Promise.all([
      this.dashboardService.getCompanyTotalCustomers(data),
      this.dashboardService.getCompanyTotalInactiveCustomers(data),
      this.dashboardService.getCompanyTotalActiveCustomers(data),
      this.dashboardService.getCompanyTotalCitiesWithoutOrders(data),
      this.dashboardService.getCompanyAverageTimeBetweenOrders(data),
      this.dashboardService.getCompanyNewCustomers(data),
      this.dashboardService.getCompanyTotalNewCustomers(data),
      this.dashboardService.getCompanyInvoiceConversion(data),
      this.dashboardService.getCompanyReactivatedCustomersCount(data),
      this.dashboardService.getCompanyReactivatedCustomersTotalValue(data),
      this.dashboardService.getCompanyInactiveToReactivatedRatio(data),
      this._getCustomersByChannel(data),
      this._getCustomersByCity(data),
      this._getInactive90Days(data),
      this._getInactive90DaysByRepresentative(data),
      this._getInactive90DaysByCollaborator(data),
      this._getDivisionBreakdown(data),
      this._getCustomersByChannelDetails(data),
    ]);

    return {
      kpis: {
        totalCustomers,
        inactiveCustomers,
        activeCustomers,
        citiesWithoutFaturamento,
        purchaseCycle,
        newCustomerCount,
        newCustomerRevenue,
        conversionRate,
        reactivatedCount,
        reactivatedRevenue,
        reactivationRate,
      },
      tables: {
        customersByChannel,
        customersByCity,
        inactive90Days,
        inactive90DaysByRep,
        inactive90DaysByColab,
        divisionBreakdown,
        customersByChannelDetails,
      },
    };
  }

  // --- COBERTURA GEO DATA ---

  async getCoberturaGeoData(data: DashboardDTO) {
    const customerWhere = this._buildCustomerWhereClause(data);

    const [normalizedCities, customersWithOrders] = await Promise.all([
      this._getCustomerCitiesNormalized(data),
      Order.findAll({
        attributes: [
          [col('customer.city'), 'city'],
          [col('customer.UF'), 'UF'],
          [fn('SUM', col('totalValue')), 'revenue'],
        ],
        where: {
          ...this._buildBaseWhereClause(data),
          status: { [Op.in]: INVOICED_ORDER_STATUSES },
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            where: { ...customerWhere, city: { [Op.ne]: null } },
            attributes: [],
            required: true,
          },
        ],
        group: [col('customer.city'), col('customer.UF')],
        raw: true,
      }),
    ]);

    const normalizedSet = new Set(
      normalizedCities.map((c) => `${c.name}|${c.stateAbbreviation}`),
    );

    const cityCoordMap = new Map(
      normalizedCities.map((c) => [`${c.name}|${c.stateAbbreviation}`, c]),
    );

    return {
      data: (customersWithOrders as any[])
        .filter((c: any) => normalizedSet.has(`${c.city}|${c.UF}`))
        .map((c: any) => {
          const cityInfo = cityCoordMap.get(`${c.city}|${c.UF}`);
          return {
            city: c.city,
            state: c.UF,
            revenue: parseFloat(c.revenue || 0),
            hasSale: true,
            latitude: cityInfo?.latitude ?? null,
            longitude: cityInfo?.longitude ?? null,
          };
        }),
    };
  }

  // --- EXPORT ---

  async getExportData(data: DashboardDTO, mode: string, report?: string) {
    if (mode === 'active' || (mode === 'report' && !report)) {
      return { data: 'Escolha uma aba ou relatório para exportar.' };
    }

    if (mode === 'full') {
      const [gestao, dinamico, faturamento, pedidos, cobertura, clientes] =
        await Promise.all([
          this.getGestaoData(data),
          this.getDinamicoData(data),
          this.getFaturamentoData(data),
          this.getPedidosData(data),
          this.getCoberturaData(data),
          this.getClientesData(data),
        ]);
      return { gestao, dinamico, faturamento, pedidos, cobertura, clientes };
    }

    if (mode === 'report') {
      switch (report) {
        case 'Gestao::resumo':
          return this.getGestaoData(data);
        case 'Gestao::regiao':
          return { data: await this._getRevenueByRegion(data) };
        case 'Gestao::representantes':
          return { data: await this._getTopRepresentatives(data) };
        case 'Gestao::colaboradores':
          return { data: await this._getTopCollaborators(data) };
        default:
          return { data: [] };
      }
    }

    const panels: Record<string, () => Promise<any>> = {
      gestao: () => this.getGestaoData(data),
      dinamico: () => this.getDinamicoData(data),
      faturamento: () => this.getFaturamentoData(data),
      pedidos: () => this.getPedidosData(data),
      cobertura: () => this.getCoberturaData(data),
      clientes: () => this.getClientesData(data),
    };

    return panels[mode] ? panels[mode]() : { data: [] };
  }

  // --- PRIVATE HELPERS ---

  private async _getCustomerCitiesNormalized(data: DashboardDTO) {
    const replacements: any = { companyId: data.companyId };
    const conditions: string[] = [];

    if (data.state && data.state.length > 0) {
      conditions.push(`c."stateAbbreviation" IN (:states)`);
      replacements.states = data.state;
    }

    if (data.cities && data.cities.length > 0) {
      conditions.push(`c.name IN (:cities)`);
      replacements.cities = data.cities;
    }

    const whereClause =
      conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const results = await Order.sequelize.query(
      `SELECT DISTINCT c.name, c."stateAbbreviation", c."stateName"
       FROM "Cities" c
       INNER JOIN "Customers" cust ON cust.city = c.name AND cust."UF" = c."stateAbbreviation"
       WHERE cust."companyId" = :companyId
       ${whereClause}`,
      { replacements, type: 'SELECT' },
    );

    return Array.isArray(results) ? (results as any[]) : [];
  }

  private async _getRevenueByRegion(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      attributes: [[fn('SUM', col('totalValue')), 'revenue']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['UF'],
          required: true,
        },
      ],
      group: [col('customer.UF')],
      raw: true,
    });

    const regionMap: Record<string, number> = {};
    (orders as any[]).forEach((o) => {
      const region = STATE_REGION_MAP[o['customer.UF']] || 'Outros';
      regionMap[region] = (regionMap[region] || 0) + parseFloat(o.revenue || 0);
    });

    return Object.entries(regionMap)
      .map(([region, revenue]) => ({
        region,
        revenue: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private async _getRevenueByMonth(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      attributes: [
        [fn('to_char', col('Order.createdAt'), 'YYYY-MM'), 'month'],
        [fn('SUM', col('totalValue')), 'revenue'],
      ],
      group: [fn('to_char', col('Order.createdAt'), 'YYYY-MM')],
      order: [[fn('to_char', col('Order.createdAt'), 'YYYY-MM'), 'ASC']],
      raw: true,
      subQuery: false,
    });
    return (results as any[]).map((r) => ({
      month: r.month,
      revenue: parseFloat(r.revenue || 0),
    }));
  }

  private async _getRevenueByState(data: DashboardDTO) {
    const orders = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      attributes: [
        [col('customer.UF'), 'state'],
        [fn('SUM', col('totalValue')), 'revenue'],
      ],
      include: [
        { model: Customer, as: 'customer', attributes: [], required: true },
      ],
      group: [col('customer.UF')],
      order: [[fn('SUM', col('totalValue')), 'DESC']],
      raw: true,
    });
    return (orders as any[]).map((o) => ({
      state: o.state,
      revenue: parseFloat(o.revenue || 0),
    }));
  }

  private async _getTopRepresentatives(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      attributes: [
        [col('responsibleUser.name'), 'name'],
        [fn('SUM', col('totalValue')), 'revenue'],
      ],
      include: [
        { model: User, as: 'responsibleUser', attributes: [], required: true },
      ],
      group: [col('responsibleUser.name')],
      order: [[fn('SUM', col('totalValue')), 'DESC']],
      limit: 10,
      raw: true,
    });
    return (results as any[]).map((r) => ({
      name: r.name,
      revenue: parseFloat(r.revenue || 0),
    }));
  }

  private async _getTopCollaborators(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      attributes: [
        [col('responsibleUser.name'), 'name'],
        [fn('SUM', col('totalValue')), 'revenue'],
      ],
      include: [
        { model: User, as: 'responsibleUser', attributes: [], required: true },
      ],
      group: [col('responsibleUser.name')],
      order: [[fn('SUM', col('totalValue')), 'DESC']],
      limit: 10,
      raw: true,
    });
    return (results as any[]).map((r) => ({
      name: r.name,
      revenue: parseFloat(r.revenue || 0),
    }));
  }

  private async _getTopProducts(data: DashboardDTO) {
    const results = await this.dashboardService.getCompanyProductsByRevenue(
      data,
    );
    return results
      .slice(0, 20)
      .map((r: any) => ({ name: r.label, revenue: r.totalRevenue }));
  }

  private async _getRankingClientes(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      attributes: [
        [col('customer.corporateName'), 'name'],
        [fn('SUM', col('totalValue')), 'revenue'],
        [fn('COUNT', col('Order.id')), 'orders'],
      ],
      include: [
        { model: Customer, as: 'customer', attributes: [], required: true },
      ],
      group: [col('customer.corporateName')],
      order: [[fn('SUM', col('totalValue')), 'DESC']],
      limit: 20,
      raw: true,
      subQuery: false,
    });
    return (results as any[]).map((r) => ({
      name: r.name,
      revenue: parseFloat(r.revenue || 0),
      orders: parseInt(r.orders, 10),
    }));
  }

  private async _getRankingClientesPedidos(data: DashboardDTO) {
    return this._getRankingClientes(data);
  }

  private async _getPedidosByRegion(data: DashboardDTO) {
    return this._getRevenueByRegion(data);
  }

  private async _getResultsByRepresentative(data: DashboardDTO) {
    const reps = await this._getTopRepresentatives(data);
    const results = [];
    for (const rep of reps) {
      const repFilter = {
        ...data,
        sellers: undefined,
        ...(rep.name ? { sellers: [] } : {}),
      };
      results.push({
        name: rep.name,
        fat: rep.revenue,
        dev: 0,
        pedidosR$: rep.revenue,
        ticket: 0,
        posit: 0,
        ativos: 0,
        inativos: 0,
        cidades: 0,
        qtdPed: 0,
      });
    }
    return results;
  }

  private async _getResultsByCollaborator(data: DashboardDTO) {
    const cols = await this._getTopCollaborators(data);
    return cols.map((c: any) => ({
      name: c.name,
      fat: c.revenue,
      dev: 0,
      pedidosR$: c.revenue,
      ticket: 0,
      posit: 0,
      ativos: 0,
      inativos: 0,
      cidades: 0,
      qtdPed: 0,
    }));
  }

  private async _getCitiesAttended(data: DashboardDTO) {
    const results = await Order.findAll({
      attributes: [
        [fn('COUNT', fn('DISTINCT', col('customer.city'))), 'count'],
      ],
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      include: [
        { model: Customer, as: 'customer', attributes: [], required: true },
      ],
      raw: true,
    });
    return results.length > 0 ? parseInt((results[0] as any).count, 10) : 0;
  }

  private async _getTotalOrderCount(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      attributes: [[fn('COUNT', col('Order.id')), 'count']],
      raw: true,
      group: [],
    });
    return results.length > 0 ? parseInt((results[0] as any).count, 10) : 0;
  }

  private async _getCitiesWithSales(data: DashboardDTO) {
    const [normalizedCities, salesCities] = await Promise.all([
      this._getCustomerCitiesNormalized(data),
      Order.findAll({
        attributes: [
          [col('customer.city'), 'city'],
          [col('customer.UF'), 'UF'],
        ],
        where: {
          ...this._buildBaseWhereClause(data),
          status: { [Op.in]: INVOICED_ORDER_STATUSES },
        },
        include: [
          { model: Customer, as: 'customer', attributes: [], required: true },
        ],
        group: [col('customer.city'), col('customer.UF')],
        raw: true,
      }),
    ]);

    if (normalizedCities.length === 0) return 0;

    const normalizedSet = new Set(
      normalizedCities.map((c) => `${c.name}|${c.stateAbbreviation}`),
    );

    return (salesCities as any[]).filter((c) =>
      normalizedSet.has(`${c.city}|${c.UF}`),
    ).length;
  }

  private async _getCitiesWithoutSales(data: DashboardDTO) {
    const [customerCities, salesCities] = await Promise.all([
      this._getCustomerCitiesNormalized(data),
      Order.findAll({
        attributes: [
          [col('customer.city'), 'city'],
          [col('customer.UF'), 'UF'],
        ],
        where: {
          ...this._buildBaseWhereClause(data),
          status: { [Op.in]: INVOICED_ORDER_STATUSES },
        },
        include: [
          { model: Customer, as: 'customer', attributes: [], required: true },
        ],
        group: [col('customer.city'), col('customer.UF')],
        raw: true,
      }),
    ]);

    if (customerCities.length === 0) return 0;

    const salesSet = new Set(
      (salesCities as any[]).map((c) => `${c.city}|${c.UF}`),
    );

    return customerCities.filter(
      (c) => !salesSet.has(`${c.name}|${c.stateAbbreviation}`),
    ).length;
  }

  private async _getCoveragePercentage(data: DashboardDTO) {
    const withSales = await this._getCitiesWithSales(data);
    const withoutSales = await this._getCitiesWithoutSales(data);
    const total = withSales + withoutSales;
    return total > 0 ? parseFloat(((withSales / total) * 100).toFixed(2)) : 0;
  }

  private async _getCoberturaByRegion(data: DashboardDTO) {
    const regionData = await this._getRevenueByRegion(data);
    const [customerCities, salesCities] = await Promise.all([
      this._getCustomerCitiesNormalized(data),
      Order.findAll({
        attributes: [
          [col('customer.city'), 'city'],
          [col('customer.UF'), 'UF'],
        ],
        where: {
          ...this._buildBaseWhereClause(data),
          status: { [Op.in]: INVOICED_ORDER_STATUSES },
        },
        include: [
          { model: Customer, as: 'customer', attributes: [], required: true },
        ],
        group: [col('customer.city'), col('customer.UF')],
        raw: true,
      }),
    ]);

    const normalizedSet = new Set(
      customerCities.map((c) => `${c.name}|${c.stateAbbreviation}`),
    );

    const regionCities: Record<string, { withSale: number; total: number }> =
      {};

    customerCities.forEach((c: any) => {
      const region = STATE_REGION_MAP[c.stateAbbreviation] || 'Outros';
      if (!regionCities[region])
        regionCities[region] = { withSale: 0, total: 0 };
      regionCities[region].total += 1;
    });

    (salesCities as any[]).forEach((o: any) => {
      if (normalizedSet.has(`${o.city}|${o.UF}`)) {
        const region = STATE_REGION_MAP[o.UF] || 'Outros';
        if (!regionCities[region])
          regionCities[region] = { withSale: 0, total: 0 };
        regionCities[region].withSale += 1;
      }
    });

    return regionData.map((r: any) => ({
      region: r.region,
      comVenda: regionCities[r.region]?.withSale || 0,
      receita: r.revenue,
    }));
  }

  private async _getCoberturaByState(data: DashboardDTO) {
    const stateRevenue = await this._getRevenueByState(data);
    const [customerCities, salesCities] = await Promise.all([
      this._getCustomerCitiesNormalized(data),
      Order.findAll({
        attributes: [
          [col('customer.city'), 'city'],
          [col('customer.UF'), 'state'],
        ],
        where: {
          ...this._buildBaseWhereClause(data),
          status: { [Op.in]: INVOICED_ORDER_STATUSES },
        },
        include: [
          { model: Customer, as: 'customer', attributes: [], required: true },
        ],
        group: [col('customer.city'), col('customer.UF')],
        raw: true,
      }),
    ]);

    const normalizedSet = new Set(
      customerCities.map((c) => `${c.name}|${c.stateAbbreviation}`),
    );

    const stateMap: Record<string, any> = {};
    stateRevenue.forEach((s: any) => {
      stateMap[s.state] = {
        state: s.state,
        comVenda: 0,
        semVenda: 0,
        revenue: s.revenue,
      };
    });

    const stateTotals: Record<string, number> = {};
    customerCities.forEach((c: any) => {
      stateTotals[c.stateAbbreviation] =
        (stateTotals[c.stateAbbreviation] || 0) + 1;
    });

    const stateSales: Record<string, number> = {};
    (salesCities as any[]).forEach((o: any) => {
      if (normalizedSet.has(`${o.city}|${o.state}`)) {
        stateSales[o.state] = (stateSales[o.state] || 0) + 1;
      }
    });

    Object.keys(stateTotals).forEach((state) => {
      if (!stateMap[state])
        stateMap[state] = { state, comVenda: 0, semVenda: 0, revenue: 0 };
      stateMap[state].comVenda = stateSales[state] || 0;
      stateMap[state].semVenda = stateTotals[state] - (stateSales[state] || 0);
    });

    return Object.values(stateMap).sort(
      (a: any, b: any) => b.revenue - a.revenue,
    );
  }

  private async _getCoberturaBySeller(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      attributes: [
        [col('responsibleUser.name'), 'seller'],
        [fn('COUNT', fn('DISTINCT', col('customer.city'))), 'cities'],
        [fn('SUM', col('totalValue')), 'revenue'],
      ],
      include: [
        { model: User, as: 'responsibleUser', attributes: [], required: true },
        { model: Customer, as: 'customer', attributes: [], required: true },
      ],
      group: [col('responsibleUser.name')],
      order: [[fn('SUM', col('totalValue')), 'DESC']],
      limit: 20,
      raw: true,
    });
    return (results as any[]).map((r) => ({
      seller: r.seller,
      cities: parseInt(r.cities, 10),
      revenue: parseFloat(r.revenue || 0),
    }));
  }

  private async _getCoberturaByCollaborator(data: DashboardDTO) {
    return this._getCoberturaBySeller(data);
  }

  private async _getCidadesComVenda(data: DashboardDTO) {
    const [normalizedCities, results] = await Promise.all([
      this._getCustomerCitiesNormalized(data),
      this._baseQuery(data, {
        where: {
          ...this._buildBaseWhereClause(data),
          status: { [Op.in]: INVOICED_ORDER_STATUSES },
        },
        attributes: [
          [col('customer.city'), 'city'],
          [col('customer.UF'), 'state'],
          [fn('SUM', col('totalValue')), 'revenue'],
        ],
        include: [
          { model: Customer, as: 'customer', attributes: [], required: true },
        ],
        group: [col('customer.city'), col('customer.UF')],
        order: [[fn('SUM', col('totalValue')), 'DESC']],
        limit: 100,
        raw: true,
      }),
    ]);

    const normalizedSet = new Set(
      normalizedCities.map((c) => `${c.name}|${c.stateAbbreviation}`),
    );

    return (results as any[])
      .filter((r) => normalizedSet.has(`${r.city}|${r.state}`))
      .map((r) => ({
        city: r.city,
        state: r.state,
        region: STATE_REGION_MAP[r.state] || 'Outros',
        revenue: parseFloat(r.revenue || 0),
      }));
  }

  private async _getCidadesSemVenda(data: DashboardDTO) {
    const [normalizedCities, withSalesCities] = await Promise.all([
      this._getCustomerCitiesNormalized(data),
      Order.findAll({
        attributes: [
          [col('customer.city'), 'city'],
          [col('customer.UF'), 'state'],
        ],
        where: { ...this._buildBaseWhereClause(data) },
        include: [
          { model: Customer, as: 'customer', attributes: [], required: true },
        ],
        group: [col('customer.city'), col('customer.UF')],
        raw: true,
      }),
    ]);

    const withSalesSet = new Set(
      (withSalesCities as any[]).map((c) => `${c.city}|${c.state}`),
    );

    return normalizedCities
      .filter((c) => !withSalesSet.has(`${c.name}|${c.stateAbbreviation}`))
      .slice(0, 100)
      .map((c) => ({
        city: c.name,
        state: c.stateAbbreviation,
        region: STATE_REGION_MAP[c.stateAbbreviation] || 'Outros',
        status: 'Sem venda',
      }));
  }

  private async _getCustomersByChannel(data: DashboardDTO) {
    const results = await Customer.findAll({
      attributes: ['customerType', [fn('COUNT', col('id')), 'count']],
      where: { companyId: data.companyId },
      group: ['customerType'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      raw: true,
    });
    return (results as any[]).map((r) => ({
      channel: r.customerType || 'N/D',
      count: parseInt(r.count, 10),
    }));
  }

  private async _getCustomersByCity(data: DashboardDTO) {
    const [customerCounts, cityRevenue] = await Promise.all([
      Customer.findAll({
        attributes: ['city', 'UF', [fn('COUNT', col('id')), 'count']],
        where: { companyId: data.companyId },
        group: ['city', 'UF'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 20,
        raw: true,
      }),
      this._baseQuery(data, {
        where: {
          ...this._buildBaseWhereClause(data),
          status: { [Op.in]: INVOICED_ORDER_STATUSES },
        },
        attributes: [
          [col('customer.city'), 'city'],
          [col('customer.UF'), 'state'],
          [fn('SUM', col('totalValue')), 'revenue'],
        ],
        include: [
          { model: Customer, as: 'customer', attributes: [], required: true },
        ],
        group: [col('customer.city'), col('customer.UF')],
        raw: true,
      }),
    ]);

    const revenueMap: Record<string, number> = {};
    (cityRevenue as any[]).forEach((r: any) => {
      const key = `${r.city}|${r.state}`;
      revenueMap[key] = parseFloat(r.revenue || 0);
    });

    return (customerCounts as any[]).map((r) => ({
      city: r.city,
      state: r.UF,
      clients: parseInt(r.count, 10),
      revenue: revenueMap[`${r.city}|${r.UF}`] || 0,
    }));
  }

  private async _getInactive90Days(data: DashboardDTO) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const customers = await Customer.findAll({
      attributes: [
        'id',
        'corporateName',
        'document',
        'city',
        'UF',
        'lastPurchaseDate',
      ],
      where: {
        companyId: data.companyId,
        [Op.or]: [
          {
            lastPurchaseDate: {
              [Op.lt]: ninetyDaysAgo.toISOString().split('T')[0],
            },
          },
          { lastPurchaseDate: null },
        ],
      },
      limit: 20,
      order: [['lastPurchaseDate', 'ASC']],
      raw: true,
    });

    if (customers.length === 0) return [];

    const inactiveIds = customers.map((c: any) => c.id);

    const lastOrderValues: Record<number, number> = {};
    if (inactiveIds.length > 0) {
      const rawResults = await Order.sequelize.query(
        `
        SELECT DISTINCT ON (o2."customerId")
          o2."customerId" AS "customerId",
          o2."totalValue" AS "totalValue"
        FROM "Orders" o2
        WHERE o2."companyId" = :companyId
          AND o2."customerId" IN (:inactiveIds)
        ORDER BY o2."customerId", o2."createdAt" DESC
      `,
        {
          replacements: { companyId: data.companyId, inactiveIds },
          type: 'SELECT',
        },
      );
      const lastOrderResults =
        Array.isArray(rawResults) &&
        rawResults.length > 0 &&
        Array.isArray(rawResults[0])
          ? rawResults[0]
          : Array.isArray(rawResults)
          ? rawResults
          : [];
      (lastOrderResults as any[]).forEach((r: any) => {
        lastOrderValues[parseInt(r.customerId, 10)] = parseFloat(
          r.totalValue || 0,
        );
      });
    }

    return (customers as any[]).map((c) => ({
      name: c.corporateName,
      document: c.document,
      city: `${c.city}/${c.UF}`,
      lastPurchase: c.lastPurchaseDate || 'Nunca',
      lastPurchaseValue: lastOrderValues[c.id] || 0,
    }));
  }

  private async _getInactive90DaysByRepresentative(data: DashboardDTO) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const customers = await Customer.findAll({
      attributes: ['id'],
      where: {
        companyId: data.companyId,
        [Op.or]: [
          {
            lastPurchaseDate: {
              [Op.lt]: ninetyDaysAgo.toISOString().split('T')[0],
            },
          },
          { lastPurchaseDate: null },
        ],
      },
      raw: true,
    });

    const inactiveIds = customers.map((c: any) => c.id);
    if (inactiveIds.length === 0) return [];

    const rawResults = await Order.sequelize.query(
      `
      SELECT
        u.name AS "representative",
        COUNT(DISTINCT o."customerId") AS "count",
        COALESCE(SUM(lv."lastValue"), 0) AS "lastPurchaseValue"
      FROM "Orders" o
      JOIN "Users" u ON u.id = o."responsibleUserId"
      LEFT JOIN LATERAL (
        SELECT o2."totalValue" AS "lastValue"
        FROM "Orders" o2
        WHERE o2."customerId" = o."customerId"
          AND o2."companyId" = :companyId
        ORDER BY o2."createdAt" DESC
        LIMIT 1
      ) lv ON true
      WHERE o."companyId" = :companyId
        AND o."customerId" IN (:inactiveIds)
      GROUP BY u.name
      ORDER BY "count" DESC
      LIMIT 20
    `,
      {
        replacements: { companyId: data.companyId, inactiveIds },
        type: 'SELECT',
      },
    );

    const results =
      Array.isArray(rawResults) &&
      rawResults.length > 0 &&
      Array.isArray(rawResults[0])
        ? rawResults[0]
        : Array.isArray(rawResults)
        ? rawResults
        : [];

    return (results as any[]).map((r: any) => ({
      representative: r.representative,
      count: parseInt(r.count, 10),
      lastPurchaseValue: parseFloat(r.lastPurchaseValue || 0),
    }));
  }

  private async _getInactive90DaysByCollaborator(data: DashboardDTO) {
    return this._getInactive90DaysByRepresentative(data);
  }

  private async _getCustomersByChannelDetails(data: DashboardDTO) {
    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      attributes: [
        [col('customer.corporateName'), 'name'],
        [col('customer.city'), 'city'],
        [col('customer.UF'), 'state'],
        [fn('SUM', col('totalValue')), 'revenue'],
        [fn('COUNT', col('Order.id')), 'orders'],
      ],
      include: [
        { model: Customer, as: 'customer', attributes: [], required: true },
      ],
      group: [
        col('customer.corporateName'),
        col('customer.city'),
        col('customer.UF'),
      ],
      order: [[fn('SUM', col('totalValue')), 'DESC']],
      limit: 50,
      raw: true,
      subQuery: false,
    });
    return (results as any[]).map((r) => ({
      name: r.name,
      city: `${r.city}/${r.state}`,
      revenue: parseFloat(r.revenue || 0),
      orders: parseInt(r.orders, 10),
    }));
  }

  private async _getDivisionBreakdown(data: DashboardDTO) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const results = await this._baseQuery(data, {
      where: {
        ...this._buildBaseWhereClause(data),
        status: { [Op.in]: INVOICED_ORDER_STATUSES },
      },
      attributes: [
        [col('responsibleUser.name'), 'collaborator'],
        [fn('COUNT', col('Order.id')), 'orders'],
        [fn('SUM', col('totalValue')), 'revenue'],
        [fn('COUNT', fn('DISTINCT', col('Order.customerId'))), 'clients'],
      ],
      include: [
        { model: User, as: 'responsibleUser', attributes: [], required: true },
      ],
      group: [col('responsibleUser.name')],
      order: [[fn('SUM', col('totalValue')), 'DESC']],
      raw: true,
    });

    const collaboratorNames = results.map((r: any) => r.collaborator);

    const inactiveCountMap: Record<string, number> = {};
    if (collaboratorNames.length > 0) {
      const rawResults = await Order.sequelize.query(
        `
        SELECT
          u.name AS "collaborator",
          COUNT(DISTINCT o."customerId") AS "inactiveCount"
        FROM "Orders" o
        JOIN "Users" u ON u.id = o."responsibleUserId"
        JOIN "Customers" c ON c.id = o."customerId"
        WHERE o."companyId" = :companyId
          AND u.name IN (:collaboratorNames)
          AND (
            c."lastPurchaseDate" < :ninetyDaysAgo
            OR c."lastPurchaseDate" IS NULL
          )
        GROUP BY u.name
      `,
        {
          replacements: {
            companyId: data.companyId,
            collaboratorNames,
            ninetyDaysAgo: ninetyDaysAgo.toISOString().split('T')[0],
          },
          type: 'SELECT',
        },
      );
      const inactiveResults =
        Array.isArray(rawResults) &&
        rawResults.length > 0 &&
        Array.isArray(rawResults[0])
          ? rawResults[0]
          : Array.isArray(rawResults)
          ? rawResults
          : [];
      (inactiveResults as any[]).forEach((r: any) => {
        inactiveCountMap[r.collaborator] = parseInt(r.inactiveCount, 10);
      });
    }

    return (results as any[]).map((r) => ({
      collaborator: r.collaborator,
      clients: parseInt(r.clients, 10),
      inactive90Days: inactiveCountMap[r.collaborator] || 0,
      orders: parseInt(r.orders, 10),
      revenue: parseFloat(r.revenue || 0),
    }));
  }
}
