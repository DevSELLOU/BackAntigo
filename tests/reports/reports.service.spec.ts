import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../../src/reports/reports.service';
import { OrdersReportsService } from '../../src/presentation/orders/orders-reports.service';
import { OrdersService } from '../../src/presentation/orders/orders.service';
import { CompaniesService } from '../../src/companies/companies.service';
import { CustomersService } from '../../src/presentation/customers/customers.service';
import { UsersService } from '../../src/users/users.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let ordersReportsService: jest.Mocked<OrdersReportsService>;
  let ordersService: jest.Mocked<OrdersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: OrdersReportsService,
          useValue: {
            generateSalesByVendorReport: jest.fn(),
            generateProductsReport: jest.fn(),
          },
        },
        {
          provide: OrdersService,
          useValue: { generateCompanyOrderReport: jest.fn() },
        },
        {
          provide: CompaniesService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: CustomersService,
          useValue: { findCustomersByCompanyId: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    ordersReportsService = module.get(OrdersReportsService);
    ordersService = module.get(OrdersService);
  });

  describe('generateCompanyOrderReport', () => {
    it('delegates to ordersService.generateCompanyOrderReport', async () => {
      ordersService.generateCompanyOrderReport.mockResolvedValue([] as any);

      const result = await service.generateCompanyOrderReport(1, ['01'], ['2026']);

      expect(ordersService.generateCompanyOrderReport).toHaveBeenCalledWith({
        companyId: 1,
        months: ['01'],
        years: ['2026'],
      });
      expect(result).toEqual([]);
    });
  });

  describe('generateCompanySalesByVendorReport', () => {
    it('delegates to ordersReportsService.generateSalesByVendorReport', async () => {
      const mockResult = [{ vendorId: 1, vendorName: 'Test', year: 2026, month: 1, orderCount: 5, totalValue: 1000, totalItems: 10 }];
      ordersReportsService.generateSalesByVendorReport.mockResolvedValue(mockResult);

      const result = await service.generateCompanySalesByVendorReport(1, ['2026-01'], undefined);

      expect(ordersReportsService.generateSalesByVendorReport).toHaveBeenCalledWith({
        companyId: 1,
        months: ['2026-01'],
        years: undefined,
      });
      expect(result).toEqual(mockResult);
    });

    it('passes months and years correctly', async () => {
      ordersReportsService.generateSalesByVendorReport.mockResolvedValue([]);

      await service.generateCompanySalesByVendorReport(1, ['2026-01', '2026-02'], ['2025']);

      expect(ordersReportsService.generateSalesByVendorReport).toHaveBeenCalledWith({
        companyId: 1,
        months: ['2026-01', '2026-02'],
        years: ['2025'],
      });
    });
  });

  describe('generateCompanyProductsReport', () => {
    it('delegates to ordersReportsService.generateProductsReport', async () => {
      const mockResult = [{ productId: 1, productName: 'Test', brand: 'Test', totalQuantitySold: 10, totalRevenue: 100, currentStock: 5, periodStart: null, periodEnd: null }];
      ordersReportsService.generateProductsReport.mockResolvedValue(mockResult);

      const result = await service.generateCompanyProductsReport(1, ['2026-01'], undefined);

      expect(ordersReportsService.generateProductsReport).toHaveBeenCalledWith({
        companyId: 1,
        months: ['2026-01'],
        years: undefined,
      });
      expect(result).toEqual(mockResult);
    });
  });
});
