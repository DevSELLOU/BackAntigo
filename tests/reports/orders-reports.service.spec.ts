import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrdersReportsService } from '../../src/presentation/orders/orders-reports.service';
import { CompaniesService } from '../../src/companies/companies.service';
import { Order } from '../../src/presentation/orders/order.entity';
import { OrderItem } from '../../src/presentation/order-items/order-item.entity';
import { StockMovement } from '../../src/presentation/stock-movement/stock-movement.entity';
import { Product } from '../../src/presentation/products/entities/product.entity';
import { User } from '../../src/users/user.entity';
import { Op } from 'sequelize';

describe('OrdersReportsService', () => {
  let service: OrdersReportsService;
  let companiesService: jest.Mocked<CompaniesService>;
  let ordersRepository: jest.Mocked<typeof Order>;
  let orderItemsRepository: jest.Mocked<typeof OrderItem>;
  let stockMovementRepository: jest.Mocked<typeof StockMovement>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersReportsService,
        {
          provide: CompaniesService,
          useValue: { findOne: jest.fn().mockResolvedValue({ id: 1 }) },
        },
        {
          provide: 'ORDER_REPOSITORY',
          useValue: { findAll: jest.fn() },
        },
        {
          provide: 'ORDER_ITEM_REPOSITORY',
          useValue: { findAll: jest.fn() },
        },
        {
          provide: 'STOCK_MOVEMENT_REPOSITORY',
          useValue: { findAll: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OrdersReportsService>(OrdersReportsService);
    companiesService = module.get(CompaniesService);
    ordersRepository = module.get('ORDER_REPOSITORY');
    orderItemsRepository = module.get('ORDER_ITEM_REPOSITORY');
    stockMovementRepository = module.get('STOCK_MOVEMENT_REPOSITORY');
  });

  describe('generateSalesByVendorReport', () => {
    it('throws when company does not exist', async () => {
      companiesService.findOne.mockRejectedValue(
        new BadRequestException('Company not found'),
      );

      await expect(
        service.generateSalesByVendorReport({ companyId: 999 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns empty array when no orders found', async () => {
      ordersRepository.findAll.mockResolvedValue([]);

      const result = await service.generateSalesByVendorReport({
        companyId: 1,
      });

      expect(result).toEqual([]);
      expect(companiesService.findOne).toHaveBeenCalledWith(1);
      expect(ordersRepository.findAll).toHaveBeenCalled();
    });

    it('calls ordersRepository.findAll with companyId filter', async () => {
      ordersRepository.findAll.mockResolvedValue([]);

      await service.generateSalesByVendorReport({ companyId: 1 });

      const callArg = ordersRepository.findAll.mock.calls[0][0];
      expect((callArg as any).where).toMatchObject({ companyId: 1 });
    });

    it('forwards dateWhere from months to orders query', async () => {
      ordersRepository.findAll.mockResolvedValue([]);

      await service.generateSalesByVendorReport({
        companyId: 1,
        months: ['2026-01'],
      });

      const callArg = ordersRepository.findAll.mock.calls[0][0];
      expect((callArg as any).where).toHaveProperty([Op.or]);
    });

    it('maps raw results to SalesByVendorReportDto', async () => {
      ordersRepository.findAll.mockResolvedValue([
        {
          vendorId: 1,
          vendorName: 'Luciana Mendes',
          year: '2026',
          month: '01',
          orderCount: '3',
          totalValue: '5000.00',
          totalItems: '15',
        },
        {
          vendorId: 2,
          vendorName: 'Carlos Eduardo',
          year: '2026',
          month: '01',
          orderCount: '2',
          totalValue: '3000.00',
          totalItems: '10',
        },
      ] as any);

      const result = await service.generateSalesByVendorReport({
        companyId: 1,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        vendorId: 1,
        vendorName: 'Luciana Mendes',
        year: 2026,
        month: 1,
        orderCount: 3,
        totalValue: 5000.0,
        totalItems: 15,
      });
    });

    it('includes responsibleUser and OrderItem in query includes', async () => {
      ordersRepository.findAll.mockResolvedValue([]);

      await service.generateSalesByVendorReport({ companyId: 1 });

      const callArg = ordersRepository.findAll.mock.calls[0][0];
      const includes = (callArg as any).include;
      expect(includes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: User, as: 'responsibleUser' }),
          expect.objectContaining({ model: OrderItem }),
        ]),
      );
    });
  });

  describe('generateProductsReport', () => {
    it('throws when company does not exist', async () => {
      companiesService.findOne.mockRejectedValue(
        new BadRequestException('Company not found'),
      );

      await expect(
        service.generateProductsReport({ companyId: 999 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns empty array when no order items found', async () => {
      orderItemsRepository.findAll.mockResolvedValue([]);

      const result = await service.generateProductsReport({
        companyId: 1,
      });

      expect(result).toEqual([]);
      expect(companiesService.findOne).toHaveBeenCalledWith(1);
    });

    it('does NOT include dateWhere in OrderItem-level WHERE — bugfix guard', async () => {
      orderItemsRepository.findAll.mockResolvedValue([]);

      await service.generateProductsReport({
        companyId: 1,
        months: ['2026-01'],
      });

      const callArg = orderItemsRepository.findAll.mock.calls[0][0];
      const topWhere = (callArg as any).where;

      // dateWhere must NOT be at the OrderItem level — it belongs only
      // in the Order include to avoid filtering by OrderItem.createdAt
      expect(topWhere).not.toHaveProperty([Op.or]);
      expect(Object.keys(topWhere).length).toBe(0);
    });

    it('applies dateWhere inside the Order include only', async () => {
      orderItemsRepository.findAll.mockResolvedValue([]);

      await service.generateProductsReport({
        companyId: 1,
        months: ['2026-01'],
      });

      const callArg = orderItemsRepository.findAll.mock.calls[0][0];
      const includes = (callArg as any).include;
      const orderInclude = includes.find(
        (i: any) => i.model === Order && i.as === 'order',
      );

      expect(orderInclude).toBeDefined();
      expect(orderInclude.where).toHaveProperty('companyId', 1);
      expect(orderInclude.where).toHaveProperty([Op.or]);
    });

    it('filters by productId when products filter is provided', async () => {
      orderItemsRepository.findAll.mockResolvedValue([]);

      await service.generateProductsReport({
        companyId: 1,
        products: ['2', '3'],
      });

      const callArg = orderItemsRepository.findAll.mock.calls[0][0];
      const topWhere = (callArg as any).where;
      expect(topWhere).toHaveProperty('productId');
      expect(topWhere.productId).toHaveProperty([Op.in]);
      expect(topWhere.productId[Op.in]).toEqual([2, 3]);
    });

    it('ignores non-numeric and empty productId filters', async () => {
      orderItemsRepository.findAll.mockResolvedValue([]);

      await service.generateProductsReport({
        companyId: 1,
        products: ['abc', '2', '', '0'],
      });

      const callArg = orderItemsRepository.findAll.mock.calls[0][0];
      const topWhere = (callArg as any).where;
      expect(topWhere.productId[Op.in]).toEqual([2]);
    });

    it('includes Product and Order in query includes', async () => {
      orderItemsRepository.findAll.mockResolvedValue([]);

      await service.generateProductsReport({ companyId: 1 });

      const callArg = orderItemsRepository.findAll.mock.calls[0][0];
      const includes = (callArg as any).include;
      expect(includes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: Product, as: 'product' }),
          expect.objectContaining({ model: Order, as: 'order' }),
        ]),
      );
    });

    it('maps raw results to ProductsReportDto with stock info', async () => {
      orderItemsRepository.findAll.mockResolvedValue([
        {
          productId: 1,
          productName: 'Notebook Dell',
          brand: 'Dell',
          totalQuantitySold: '5',
          totalRevenue: '22995.00',
        },
      ] as any);
      stockMovementRepository.findAll.mockResolvedValue([
        { productId: 1, stockIn: '15', stockOut: '6' },
      ] as any);

      const result = await service.generateProductsReport({
        companyId: 1,
        months: ['2026-01'],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        productId: 1,
        productName: 'Notebook Dell',
        brand: 'Dell',
        totalQuantitySold: 5,
        totalRevenue: 22995.0,
        currentStock: 9,
      });
      expect(result[0].periodStart).toBe('2026-01-01');
    });

    it('sets currentStock to 0 when no stock movements exist', async () => {
      orderItemsRepository.findAll.mockResolvedValue([
        {
          productId: 1,
          productName: 'Notebook Dell',
          brand: 'Dell',
          totalQuantitySold: '5',
          totalRevenue: '22995.00',
        },
      ] as any);
      stockMovementRepository.findAll.mockResolvedValue([]);

      const result = await service.generateProductsReport({
        companyId: 1,
        months: ['2026-01'],
      });

      expect(result[0].currentStock).toBe(0);
    });

    it('handles periodStart/periodEnd as null when no filter provided', async () => {
      orderItemsRepository.findAll.mockResolvedValue([
        {
          productId: 1,
          productName: 'Notebook Dell',
          brand: 'Dell',
          totalQuantitySold: '5',
          totalRevenue: '22995.00',
        },
      ] as any);
      stockMovementRepository.findAll.mockResolvedValue([]);

      const result = await service.generateProductsReport({
        companyId: 1,
      });

      expect(result[0].periodStart).toBeNull();
      expect(result[0].periodEnd).toBeNull();
    });
  });
});
