import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardFilterService } from './dashboard-filter.service';
import { DashboardDTO } from './dtos/dashboard.dto';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
@Controller('companies/:companyId/dashboard/filters')
export class DashboardFilterController {
  constructor(private readonly filterService: DashboardFilterService) {}

  @Get('states')
  getCompanyStates(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.filterService.getCompanyStates(companyId);
  }

  @Get('cities')
  getCompanyCities(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.filterService.getCompanyCities(companyId);
  }

  @Get('products')
  getCompanyProducts(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.filterService.getCompanyProducts(companyId);
  }

  @Get('customers')
  getCompanyCustomers(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.filterService.getCompanyCustomers(companyId);
  }

  @Get('sellers')
  getCompanySellers(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.filterService.getResponsibleUsers(companyId);
  }

  @Get('managers')
  getCompanyManagers(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.filterService.getManagers(companyId);
  }
}
