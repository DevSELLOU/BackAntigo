import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportViewer } from 'src/auth/decorators/report-viewer.decorator';
import { ReportsService } from './reports.service';
import { ReportsQuery, parseReportsQuery } from './reports.query';

@ApiTags('reports')
@Controller()
@ApiBearerAuth()
export class ReportsController {
  constructor(
    @Inject(ReportsService)
    private readonly reportsService: ReportsService,
  ) {}

  @ReportViewer()
  @Get('reports/:companyId/orders')
  async generateOrderReport(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() query: ReportsQuery,
  ) {
    const { months, years } = parseReportsQuery(query);

    const orderReport = await this.reportsService.generateCompanyOrderReport(
      companyId,
      months,
      years,
    );

    return {
      message: 'Relatório do pedido gerado com sucesso',
      data: orderReport,
    };
  }

  @ReportViewer()
  @Get('reports/:companyId/sales')
  async generateSalesReport(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() query: ReportsQuery,
  ) {
    const { months, years } = parseReportsQuery(query);

    const salesReport =
      await this.reportsService.generateCompanySalesByVendorReport(
        companyId,
        months,
        years,
      );

    return {
      message: 'Relatório de vendas gerado com sucesso',
      data: salesReport,
    };
  }

  @ReportViewer()
  @Get('reports/:companyId/products')
  async generateProductsReport(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() query: ReportsQuery,
  ) {
    const { months, years } = parseReportsQuery(query);

    const productsReport =
      await this.reportsService.generateCompanyProductsReport(
        companyId,
        months,
        years,
      );

    return {
      message: 'Relatório de produtos gerado com sucesso',
      data: productsReport,
    };
  }

  @ReportViewer()
  @Get('reports/:companyId/products/:productId/customers')
  async getProductCustomers(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: ReportsQuery,
  ) {
    const { months, years } = parseReportsQuery(query);

    const customers =
      await this.reportsService.getProductCustomers(
        companyId,
        productId,
        months,
        years,
      );

    return {
      message: 'Clientes do produto carregados com sucesso',
      data: customers,
    };
  }

  @ReportViewer()
  @Get('reports/:companyId/orders-summary')
  async generateOrdersReport(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() query: ReportsQuery,
  ) {
    const { months, years } = parseReportsQuery(query);

    const ordersReport = await this.reportsService.generateCompanyOrdersReport(
      companyId,
      months,
      years,
    );

    return {
      message: 'Relatório de pedidos gerado com sucesso',
      data: ordersReport,
    };
  }
}
