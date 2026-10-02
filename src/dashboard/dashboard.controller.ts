import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CompanyOwnershipGuard } from 'src/auth/guards/company-ownership.guard';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { DashboardQueryPipe } from './dashboard-query.pipe';
import { DashboardService } from './dashboard.service';
import { DashboardDTO } from './dtos/dashboard.dto';

@ApiTags('dashboard')
@Controller()
@ApiBearerAuth()
export class DashboardController {
  constructor(
    @Inject(DashboardService)
    private readonly dashboardService: DashboardService,
  ) {}

  @Roles(UserRole.Administrator)
  @Get('dashboard/metrics/active-companies')
  async getNumberOfActiveCompanies() {
    const activeCompanies =
      await this.dashboardService.getNumberOfActiveCompanies();

    return {
      message: 'Número de Empresas ativas retornadas com sucesso',
      data: activeCompanies,
    };
  }

  @Roles(UserRole.Administrator)
  @Get('dashboard/metrics/active-users')
  async getNumberOfActiveUsers() {
    const activeUsers = await this.dashboardService.getNumberOfActiveUsers();

    return {
      message: 'Número de Usuários ativos retornados com sucesso',
      data: activeUsers,
    };
  }

  @Roles(UserRole.Administrator)
  @Get('dashboard/metrics/total-order-value')
  async getTotalOrdersValue() {
    const totalOrderValue = await this.dashboardService.getTotalOrdersValue();

    return {
      message: 'Valor total de pedidos retornado com sucesso',
      data: totalOrderValue,
    };
  }

  @Roles(UserRole.Administrator)
  @Get('dashboard/metrics/total-orders')
  async getTotalOrders() {
    const totalOrders = await this.dashboardService.getTotalOrders();

    return {
      message: 'Número total de pedidos retornados com sucesso',
      data: totalOrders,
    };
  }

  @Roles(UserRole.Administrator)
  @Get('dashboard/metrics/average-order-value')
  async getAverageOrderValue() {
    const averageOrderValue =
      await this.dashboardService.getAverageOrderValue();

    return {
      message: 'Valor médio de pedidos retornado com sucesso',
      data: averageOrderValue,
    };
  }

  @Roles(UserRole.Administrator)
  @Get('dashboard/charts/revenue-by-company')
  async getRevenueChartByCompany() {
    const revenueByCompany =
      await this.dashboardService.getRevenueChartByCompany();

    return {
      message: 'Receita por Empresa retornada com sucesso',
      data: revenueByCompany,
    };
  }

  @Roles(UserRole.Administrator)
  @Get('dashboard/charts/orders-by-company')
  async getOrdersChartByCompany() {
    const ordersByCompany =
      await this.dashboardService.getOrdersChartByCompany();

    return {
      message: 'Pedidos por Empresa retornados com sucesso',
      data: ordersByCompany,
    };
  }

  @Roles(UserRole.Administrator)
  @Get('dashboard/charts/orders-per-day')
  async getOrdersChartByDay() {
    const ordersByDay = await this.dashboardService.getOrdersChartByDay();

    return {
      message: 'Pedidos por dia retornados com sucesso',
      data: ordersByDay,
    };
  }

  @Roles(UserRole.Administrator)
  @Get('dashboard/charts/revenue-per-day')
  async getRevenueChartByDay() {
    const revenueByDay = await this.dashboardService.getRevenueChartByDay();

    return {
      message: 'Receita por dia retornada com sucesso',
      data: revenueByDay,
    };
  }

  // Metrics

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/revenue')
  async getCompanyRevenue(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue = await this.dashboardService.getCompanyRevenue({
      companyId: id,
      ...query,
    });

    return {
      message: 'Receita da Empresa retornada com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/invoices')
  async getCompanyInvoices(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue = await this.dashboardService.getCompanyInvoices({
      companyId: id,
      ...query,
    });

    return {
      message: 'Faturamento da Empresa retornado com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/returns')
  async getCompanyReturns(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue = await this.dashboardService.getCompanyReturns({
      companyId: id,
      ...query,
    });

    return {
      message: 'Devoluções da Empresa retornada com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/active-users')
  async getCompanyActiveUsers(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const activeUsers = await this.dashboardService.getCompanyActiveUsers({
      companyId: id,
      ...query,
    });

    return {
      message: 'Número de Usuários ativos da Empresa retornados com sucesso',
      data: activeUsers,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/total-customers')
  async getCompanyTotalCustomers(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const totalCustomers = await this.dashboardService.getCompanyTotalCustomers(
      { companyId: id, ...query },
    );

    return {
      message: 'Número total de clientes da Empresa retornados com sucesso',
      data: totalCustomers,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/total-active-customers')
  async getCompanyTotalActiveCustomers(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const totalCustomers =
      await this.dashboardService.getCompanyTotalActiveCustomers({
        companyId: id,
        ...query,
      });

    return {
      message: 'Número total de clientes da Empresa retornados com sucesso',
      data: totalCustomers,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/total-inactive-customers')
  async getCompanyTotalInactiveCustomers(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const totalCustomers =
      await this.dashboardService.getCompanyTotalInactiveCustomers({
        companyId: id,
        ...query,
      });

    return {
      message:
        'Número total de clientes inativos da Empresa retornados com sucesso',
      data: totalCustomers,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/total-cities-without-orders')
  async getCompanyTotalCitiesWithoutOrders(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const totalCustomers =
      await this.dashboardService.getCompanyTotalCitiesWithoutOrders({
        companyId: id,
        ...query,
      });

    return {
      message:
        'Numero total de cidades sem pedidos da Empresa retornados com sucesso',
      data: totalCustomers,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/total-new-customers')
  async getCompanyNewCustomers(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const totalCustomers = await this.dashboardService.getCompanyNewCustomers({
      companyId: id,
      ...query,
    });

    return {
      message:
        'Numero total de novos clientes da Empresa retornados com sucesso',
      data: totalCustomers,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/total-amount-new-customers')
  async getCompanyTotalNewCustomers(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const totalCustomers =
      await this.dashboardService.getCompanyTotalNewCustomers({
        companyId: id,
        ...query,
      });

    return {
      message:
        'Valor total de novos clientes da Empresa retornados com sucesso',
      data: totalCustomers,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/average-ticket')
  async getCompanyAverageTicket(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const averageTicket = await this.dashboardService.getCompanyAverageTicket({
      companyId: id,
      ...query,
    });

    return {
      message: 'Ticket médio da Empresa retornado com sucesso',
      data: averageTicket,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/average-mix-items')
  async getCompanyAverageMixItems(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const averageTicket = await this.dashboardService.getCompanyAverageMixItems(
      { companyId: id, ...query },
    );

    return {
      message: 'Mix médio da Empresa retornado com sucesso',
      data: averageTicket,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/canceled-orders')
  async getCompanyCanceledOrders(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue = await this.dashboardService.getCompanyCanceledOrders(
      { companyId: id, ...query },
    );

    return {
      message: 'Pedidos cancelados da Empresa retornados com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/average-time-between-orders')
  async getCompanyAverageTimeBetweenOrders(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue =
      await this.dashboardService.getCompanyAverageTimeBetweenOrders({
        companyId: id,
        ...query,
      });

    return {
      message: 'Média de tempo entre pedidos da Empresa retornada com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/invoice-conversion')
  async getCompanyInvoiceConversion(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue =
      await this.dashboardService.getCompanyInvoiceConversion({
        companyId: id,
        ...query,
      });

    return {
      message: 'Conversão de faturamento da Empresa retornada com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/reactivated-customers-count')
  async getCompanyReactivatedCustomersCount(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue =
      await this.dashboardService.getCompanyReactivatedCustomersCount({
        companyId: id,
        ...query,
      });

    return {
      message: 'Conversão de faturamento da Empresa retornada com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/reactivated-customers-total-value')
  async getCompanyReactivatedCustomersTotalValue(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue =
      await this.dashboardService.getCompanyReactivatedCustomersTotalValue({
        companyId: id,
        ...query,
      });

    return {
      message: 'Pedidos de clientes reativados com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/reactivated-customers-ratio')
  async getCompanyInactiveToReactivatedRatio(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue =
      await this.dashboardService.getCompanyInactiveToReactivatedRatio({
        companyId: id,
        ...query,
      });

    return {
      message: 'Percentual de clientes reativados com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/total-orders-in-approval')
  async getCompanyTotalInApprovalOrders(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue =
      await this.dashboardService.getCompanyTotalInApprovalOrders({
        companyId: id,
        ...query,
      });

    return {
      message: 'Total de pedidos em carteira com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/total-orders-approved')
  async getCompanyTotalApprovedOrders(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue =
      await this.dashboardService.getCompanyTotalApprovedOrders({
        companyId: id,
        ...query,
      });

    return {
      message: 'Total de pedidos aprovados com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/total-orders-on-budget')
  async getCompanyTotalOnBudgetOrders(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue =
      await this.dashboardService.getCompanyTotalOnBudgetOrders({
        companyId: id,
        ...query,
      });

    return {
      message: 'Total de pedidos em orçamento com sucesso',
      data: companyRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/metrics/total-orders-blocked')
  async getCompanyTotalBlockedOrders(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const companyRevenue =
      await this.dashboardService.getCompanyTotalBlockedOrders({
        companyId: id,
        ...query,
      });

    return {
      message: 'Total de pedidos em orçamento com sucesso',
      data: companyRevenue,
    };
  }

  // Charts

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/charts/orders-over-time')
  async getCompanyOrdersOverTime(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const ordersOverTime = await this.dashboardService.getCompanyOrdersOverTime(
      { companyId: id, ...query },
    );

    return {
      message: 'Pedidos ao longo do tempo retornados com sucesso',
      data: ordersOverTime,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/charts/revenue-over-time')
  async getCompanyRevenueOverTime(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const revenueOverTime =
      await this.dashboardService.getCompanyRevenueOverTime({
        companyId: id,
        ...query,
      });

    return {
      message: 'Faturamento ao longo do tempo retornado com sucesso',
      data: revenueOverTime,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/charts/customers-with-order-per-month')
  async getCompanyCustomersWithOrderPerMonth(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const customersWithOrderPerMonth =
      await this.dashboardService.getCompanyCustomersWithOrderPerMonth({
        companyId: id,
        ...query,
      });

    return {
      message: 'Clientes com pedido por mês retornados com sucesso',
      data: customersWithOrderPerMonth,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/charts/orders-by-product-category')
  async getCompanyOrdersByProductCategory(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const ordersByProductCategory =
      await this.dashboardService.getCompanyOrdersByProductCategory({
        companyId: id,
        ...query,
      });

    return {
      message: 'Pedidos por categoria de produto retornados com sucesso',
      data: ordersByProductCategory,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/charts/orders-by-payment-condition')
  async getCompanyOrdersByPaymentCondition(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const ordersByPaymentCondition =
      await this.dashboardService.getCompanyOrdersByPaymentCondition({
        companyId: id,
        ...query,
      });

    return {
      message: 'Pedidos por condição de pagamento retornados com sucesso',
      data: ordersByPaymentCondition,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/charts/orders-by-value-range')
  async getCompanyOrdersByValueRange(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const ordersByValueRange =
      await this.dashboardService.getCompanyOrdersByValueRange({
        companyId: id,
        ...query,
      });

    return {
      message: 'Pedidos por faixa de valor retornados com sucesso',
      data: ordersByValueRange,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/charts/products-by-revenue')
  async getCompanyProductsByRevenue(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const productsByRevenue =
      await this.dashboardService.getCompanyProductsByRevenue({
        companyId: id,
        ...query,
      });

    return {
      message: 'Produtos por faturamento retornados com sucesso',
      data: productsByRevenue,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @UseGuards(CompanyOwnershipGuard)
  @Get('companies/:id/dashboard/charts/average-orders-per-customer')
  async getCompanyAverageOrdersPerCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const averageOrdersPerCustomer =
      await this.dashboardService.getCompanyAverageOrdersPerCustomer({
        companyId: id,
        ...query,
      });

    return {
      message: 'Média de pedidos por cliente retornada com sucesso',
      data: averageOrdersPerCustomer,
    };
  }
}
