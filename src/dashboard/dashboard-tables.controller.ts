import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Body,
  UseGuards,
  Inject,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CompanyOwnershipGuard } from 'src/auth/guards/company-ownership.guard';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { DashboardQueryPipe } from './dashboard-query.pipe';
import { DashboardTablesService } from './dashboard-tables.service';
import { DashboardDTO } from './dtos/dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
@UseGuards(CompanyOwnershipGuard)
@Controller('companies/:companyId/dashboard')
export class DashboardTablesController {
  constructor(
    @Inject(DashboardTablesService)
    private readonly tablesService: DashboardTablesService,
  ) {}

  @Get('gestao')
  async getGestao(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const data = await this.tablesService.getGestaoData({
      companyId,
      ...query,
    });
    return { message: 'Dados de gestão retornados com sucesso', data };
  }

  @Get('dinamico')
  async getDinamico(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const data = await this.tablesService.getDinamicoData({
      companyId,
      ...query,
    });
    return { message: 'Dados do painel dinâmico retornados com sucesso', data };
  }

  @Get('faturamento')
  async getFaturamento(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const data = await this.tablesService.getFaturamentoData({
      companyId,
      ...query,
    });
    return { message: 'Dados de faturamento retornados com sucesso', data };
  }

  @Get('pedidos')
  async getPedidos(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const data = await this.tablesService.getPedidosData({
      companyId,
      ...query,
    });
    return { message: 'Dados de pedidos retornados com sucesso', data };
  }

  @Get('cobertura')
  async getCobertura(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const data = await this.tablesService.getCoberturaData({
      companyId,
      ...query,
    });
    return { message: 'Dados de cobertura retornados com sucesso', data };
  }

  @Get('clientes')
  async getClientes(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    const data = await this.tablesService.getClientesData({
      companyId,
      ...query,
    });
    return { message: 'Dados de clientes retornados com sucesso', data };
  }

  @Get('coverage/geo-data')
  async getGeoData(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
  ) {
    return this.tablesService.getCoberturaGeoData({ companyId, ...query });
  }

  @Post('export')
  async exportData(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query(DashboardQueryPipe) query: Omit<DashboardDTO, 'companyId'>,
    @Body() body: { mode: string; report?: string; tab?: string },
    @Res() res: Response,
  ) {
    const data = await this.tablesService.getExportData(
      { companyId, ...query },
      body.mode || body.tab || 'gestao',
      body.report,
    );
    res.json({ message: 'Dados exportados com sucesso', data });
  }
}
