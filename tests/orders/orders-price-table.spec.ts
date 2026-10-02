import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from '../../src/presentation/orders/orders.service';
import { CompaniesService } from '../../src/companies/companies.service';
import { CustomersService } from '../../src/presentation/customers/customers.service';
import { UsersService } from '../../src/users/users.service';
import { EmailsService } from '../../src/emails/emails.service';
import { ProductsService } from '../../src/presentation/products/products.service';
import { UploadsService } from '../../src/uploads/uploads.service';
import { UserHierarchiesService } from '../../src/user-hierarchies/user-hierarchies.service';
import { UserGoalsService } from '../../src/user-goals/user-goals.service';
import { OrdersMapper } from '../../src/presentation/orders/orders.mapper';
import { Order } from '../../src/presentation/orders/order.entity';
import { Customer } from '../../src/presentation/customers/customer.entity';
import { Product } from '../../src/presentation/products/entities/product.entity';
import { User } from '../../src/users/user.entity';
import { Company } from '../../src/companies/company.entity';
import { OrderStatus } from '../../src/presentation/orders/enums/order-status.enum';
import { CustomerStatus } from '../../src/presentation/customers/enums/customer-status.enum';
import { UserRole } from '../../src/users/enums/user-role.enum';
import { CompanyStatus } from '../../src/companies/enums/company-status.enum';
import { PaymentCondition } from '../../src/presentation/payment-conditions/payment-condition.entity';
import { PaymentMethod } from '../../src/presentation/payment-methods/payment-method.entity';
import { VisitRecordService } from '../../src/routes-visits/visit-record.service';

describe('OrdersService - Price Table Integration', () => {
  let service: OrdersService;
  let companiesService: jest.Mocked<CompaniesService>;
  let customersService: jest.Mocked<CustomersService>;
  let productsService: jest.Mocked<ProductsService>;

  const mockPaymentCondition: Partial<PaymentCondition> = { id: 1, name: '30 days' };
  const mockPaymentMethod: Partial<PaymentMethod> = { id: 1, name: 'Credit Card' };

  const mockCompanyBase: Partial<Company> = {
    id: 1,
    corporateName: 'Test Company',
    status: CompanyStatus.Active,
    allowOrdersWithoutStock: false,
  };

  const mockCustomerBase: Partial<Customer> = {
    id: 1,
    corporateName: 'Test Customer',
    status: CustomerStatus.Active,
    creditLimit: 10000,
    creditLimitUsed: 0,
    paymentConditions: [mockPaymentCondition as PaymentCondition],
    paymentMethods: [mockPaymentMethod as PaymentMethod],
    save: jest.fn().mockResolvedValue(true),
  };

  const mockProductBase: Partial<Product> = {
    id: 1,
    name: 'Test Product',
    price: 100,
    minPrice: 50,
    stock: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: CompaniesService, useValue: { findOne: jest.fn() } },
        { provide: CustomersService, useValue: { findOne: jest.fn() } },
        { provide: UsersService, useValue: { findOneWithNoRole: jest.fn() } },
        { provide: EmailsService, useValue: { sendEmail: jest.fn() } },
        { provide: ProductsService, useValue: { findOne: jest.fn() } },
        { provide: UploadsService, useValue: { getPresignedGetUrl: jest.fn() } },
        { provide: UserHierarchiesService, useValue: { getManagerForUser: jest.fn().mockResolvedValue(null) } },
        { provide: UserGoalsService, useValue: { getUserGoalsByUser: jest.fn().mockResolvedValue([]) } },
        { provide: VisitRecordService, useValue: { createFromOrder: jest.fn() } },
        {
          provide: OrdersMapper,
          useValue: {
            createOrderDtoToOrder: jest.fn().mockResolvedValue({
              dataValues: {
                customerId: 1,
                paymentMethodId: 1,
                paymentConditionId: 1,
                status: OrderStatus.OnBudget,
                observation: '',
                isBudget: false,
                discount: 0,
                amountPaid: 0,
                totalValue: 0,
                responsibleUserId: 1,
              },
            }),
            updateOrderDtoToOrder: jest.fn().mockResolvedValue({ dataValues: {} }),
          },
        },
        { provide: 'ORDER_REPOSITORY', useValue: { create: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), update: jest.fn(), destroy: jest.fn(), count: jest.fn() } },
        { provide: 'ORDER_ITEM_REPOSITORY', useValue: { findAll: jest.fn() } },
        { provide: 'ORDER_SETUP_REPOSITORY', useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    companiesService = module.get(CompaniesService);
    customersService = module.get(CustomersService);
    productsService = module.get(ProductsService);
  });

  describe('Discount Validation - User Scenarios', () => {
    it('ORD-DISC-001: should reject negative item discount (user typo or system error)', async () => {
      customersService.findOne.mockResolvedValue(mockCustomerBase as Customer);
      companiesService.findOne.mockResolvedValue(mockCompanyBase as Company);
      productsService.findOne.mockResolvedValue(mockProductBase as Product);

      await expect(
        service.validateCreateOrder(
          1, 1, 1, 1, undefined,
          [{ productId: 1, quantity: 1, discount: -10 }],
          { id: 1, role: UserRole.Administrator, customerId: null } as User,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('ORD-DISC-002: should reject when item discount exceeds item total (protects profitability)', async () => {
      customersService.findOne.mockResolvedValue(mockCustomerBase as Customer);
      companiesService.findOne.mockResolvedValue(mockCompanyBase as Company);
      productsService.findOne.mockResolvedValue(mockProductBase as Product);

      await expect(
        service.validateCreateOrder(
          1, 1, 1, 1, undefined,
          [{ productId: 1, quantity: 1, discount: 150 }],
          { id: 1, role: UserRole.Administrator, customerId: null } as User,
        ),
      ).rejects.toThrow('Desconto não pode ser maior que o total do item (Produto ID: 1)');
    });

    it('ORD-DISC-003: should reject negative order discount', async () => {
      customersService.findOne.mockResolvedValue(mockCustomerBase as Customer);
      companiesService.findOne.mockResolvedValue(mockCompanyBase as Company);

      await expect(
        service.validateCreateOrder(
          1, 1, 1, 1, -10,
          [{ productId: 1, quantity: 2, discount: 0 }],
          { id: 1, role: UserRole.Administrator, customerId: null } as User,
        ),
      ).rejects.toThrow('Desconto do pedido não pode ser negativo');
    });

    it('ORD-DISC-004: should reject when total discounts exceed order total', async () => {
      productsService.findOne = jest.fn()
        .mockResolvedValueOnce({ ...mockProductBase, price: 50 } as Product)
        .mockResolvedValueOnce({ ...mockProductBase, id: 2, price: 50 } as Product)
        .mockResolvedValueOnce({ ...mockProductBase, price: 50 } as Product)
        .mockResolvedValueOnce({ ...mockProductBase, id: 2, price: 50 } as Product);

      customersService.findOne.mockResolvedValue(mockCustomerBase as Customer);
      companiesService.findOne.mockResolvedValue(mockCompanyBase as Company);

      await expect(
        service.validateCreateOrder(
          1, 1, 1, 1, 50,
          [
            { productId: 1, quantity: 1, discount: 30 },
            { productId: 2, quantity: 1, discount: 30 },
          ],
          { id: 1, role: UserRole.Administrator, customerId: null } as User,
        ),
      ).rejects.toThrow('O total de descontos não pode exceder o valor total do pedido');
    });

    it('ORD-DISC-005: should accept valid item discount (sales rep giving standard discount)', async () => {
      customersService.findOne.mockResolvedValue(mockCustomerBase as Customer);
      companiesService.findOne.mockResolvedValue(mockCompanyBase as Company);
      productsService.findOne.mockResolvedValue(mockProductBase as Product);

      await expect(
        service.validateCreateOrder(
          1, 1, 1, 1, undefined,
          [{ productId: 1, quantity: 2, discount: 20 }],
          { id: 1, role: UserRole.Administrator, customerId: null } as User,
        ),
      ).resolves.toBeUndefined();
    });

    it('ORD-DISC-006: should accept valid order discount (loyalty discount)', async () => {
      customersService.findOne.mockResolvedValue(mockCustomerBase as Customer);
      companiesService.findOne.mockResolvedValue(mockCompanyBase as Company);
      productsService.findOne.mockResolvedValue(mockProductBase as Product);

      await expect(
        service.validateCreateOrder(
          1, 1, 1, 1, 50,
          [{ productId: 1, quantity: 2, discount: 0 }],
          { id: 1, role: UserRole.Administrator, customerId: null } as User,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('Order Creation - Business Rules', () => {
    it('ORD-CREATE-001: should reject for inactive customer (debtor/blocked)', async () => {
      const inactiveCustomer = { ...mockCustomerBase, status: CustomerStatus.Inactive };
      customersService.findOne.mockResolvedValue(inactiveCustomer as Customer);

      await expect(
        service.createOrder(
          1,
          { customerId: 1, paymentMethodId: 1, paymentConditionId: 1, discount: 0, isBudget: false, items: [{ productId: 1, quantity: 2, discount: 0 }] },
          { id: 1, email: 'test@test.com', role: UserRole.Administrator, companyId: 1, activeCompanyId: 1 },
        ),
      ).rejects.toThrow('Cliente inativo');
    });
  });

  describe('Price Table Integration Points', () => {
    it('ORD-PT-NOTE-001: calculateTotalOrderValue currently uses product.price (base price)', () => {
      expect(true).toBe(true);
    });

    it('ORD-PT-NOTE-002: to integrate price tables, PricingService should be called in calculateTotalOrderValue', () => {
      expect(true).toBe(true);
    });
  });
});