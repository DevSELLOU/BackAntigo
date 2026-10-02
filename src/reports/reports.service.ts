import { Inject, Injectable } from '@nestjs/common';
import { CompaniesService } from 'src/companies/companies.service';
import { CustomersService } from 'src/presentation/customers/customers.service';
import { OrdersReportsService } from 'src/presentation/orders/orders-reports.service';
import { OrdersService } from 'src/presentation/orders/orders.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(OrdersService)
    private readonly ordersService: OrdersService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(OrdersReportsService)
    private readonly ordersReportsService: OrdersReportsService,
  ) {}

  async generateCompanyOrderReport(
    companyId: number,
    months?: string[],
    years?: string[],
  ) {
    return this.ordersService.generateCompanyOrderReport({
      companyId,
      months,
      years,
    });
  }

  async generateCompanySalesByVendorReport(
    companyId: number,
    months?: string[],
    years?: string[],
  ) {
    return this.ordersReportsService.generateSalesByVendorReport({
      companyId,
      months,
      years,
    });
  }

  async generateCompanyProductsReport(
    companyId: number,
    months?: string[],
    years?: string[],
  ) {
    return this.ordersReportsService.generateProductsReport({
      companyId,
      months,
      years,
    });
  }

  async getProductCustomers(
    companyId: number,
    productId: number,
    months?: string[],
    years?: string[],
  ) {
    return this.ordersReportsService.getProductCustomers(
      companyId,
      productId,
      months,
      years,
    );
  }

  async generateCompanyOrdersReport(
    companyId: number,
    months?: string[],
    years?: string[],
  ) {
    return this.ordersReportsService.generateOrdersReport({
      companyId,
      months,
      years,
    });
  }
}
