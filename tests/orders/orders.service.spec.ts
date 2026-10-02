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
import { OrderItem } from '../../src/presentation/order-items/order-item.entity';
import { Customer } from '../../src/presentation/customers/customer.entity';
import { Product } from '../../src/presentation/products/entities/product.entity';
import { User } from '../../src/users/user.entity';
import { Company } from '../../src/companies/company.entity';
import { OrderStatus } from '../../src/presentation/orders/enums/order-status.enum';
import { CustomerStatus } from '../../src/presentation/customers/enums/customer-status.enum';
import { VisitRecordService } from '../../src/routes-visits/visit-record.service';
import { UserRole } from '../../src/users/enums/user-role.enum';
import { CompanyStatus } from '../../src/companies/enums/company-status.enum';
import { UserStatus } from '../../src/users/enums/user-status.enum';
import { PaymentCondition } from '../../src/presentation/payment-conditions/payment-condition.entity';
import { PaymentMethod } from '../../src/presentation/payment-methods/payment-method.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let companiesService: jest.Mocked<CompaniesService>;
  let customersService: jest.Mocked<CustomersService>;

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

  const mockProduct: Partial<Product> = {
    id: 1,
    name: 'Test Product',
    price: 100,
    stock: 10,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockOrderItemBase: Partial<OrderItem> = {
    id: 1,
    productId: 1,
    quantity: 5,
    discount: 0,
    product: mockProduct as Product,
  };

  const mockOrderBase: Partial<Order> = {
    id: 1,
    companyId: 1,
    customerId: 1,
    status: OrderStatus.OnBudget,
    totalValue: 500,
    discount: 0,
    responsibleUserId: 1,
    save: jest.fn().mockResolvedValue(true),
    orderItems: [mockOrderItemBase as OrderItem],
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
            updateAmountPaidDtoToOrder: jest.fn().mockResolvedValue({ dataValues: {} }),
          },
        },
        { provide: 'ORDER_REPOSITORY', useValue: { create: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), update: jest.fn(), destroy: jest.fn(), count: jest.fn() } },
        { provide: 'ORDER_ITEM_REPOSITORY', useValue: { bulkCreate: jest.fn(), findAll: jest.fn(), destroy: jest.fn(), update: jest.fn(), create: jest.fn() } },
        { provide: 'ORDER_SETUP_REPOSITORY', useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    companiesService = module.get(CompaniesService);
    customersService = module.get(CustomersService);
  });

  describe('Stock Management with allowOrdersWithoutStock', () => {
    it('ORD-013: should approve order when allowOrdersWithoutStock is TRUE (stock not required)', async () => {
      const companyWithStockAllowed = { ...mockCompanyBase, allowOrdersWithoutStock: true };
      const mockCustomer = { ...mockCustomerBase, creditLimit: 10000, creditLimitUsed: 0 };
      const mockOrder = {
        ...mockOrderBase,
        status: OrderStatus.InApproval,
        customer: mockCustomer,
        orderItems: [{ ...mockOrderItemBase, quantity: 100, product: { ...mockProduct, stock: 10 } }],
      };

      companiesService.findOne.mockResolvedValue(companyWithStockAllowed as Company);

      const ordersRepository = service.getModel();
      (ordersRepository.findOne as jest.Mock).mockResolvedValue(mockOrder);
      (ordersRepository.update as jest.Mock).mockResolvedValue([1]);
      (ordersRepository.findAll as jest.Mock).mockResolvedValue([]);

      const result = await service.updateStatus(1, 1, { status: OrderStatus.Approved }, 1);
      expect(result.originalOrder.status).toBe(OrderStatus.Approved);
    });

    it('ORD-014: should throw error when credit limit exceeded', async () => {
      const companyWithStockAllowed = { ...mockCompanyBase, allowOrdersWithoutStock: true };
      const mockCustomer = { ...mockCustomerBase, creditLimit: 100, creditLimitUsed: 0 };
      const mockOrder = {
        ...mockOrderBase,
        status: OrderStatus.InApproval,
        customer: mockCustomer,
        orderItems: [{ ...mockOrderItemBase, quantity: 10, product: { ...mockProduct, price: 100 } }],
      };

      companiesService.findOne.mockResolvedValue(companyWithStockAllowed as Company);

      const ordersRepository = service.getModel();
      (ordersRepository.findOne as jest.Mock).mockResolvedValue(mockOrder);

      await expect(service.updateStatus(1, 1, { status: OrderStatus.Approved }, 1)).rejects.toThrow(BadRequestException);
    });

    it('ORD-015: should throw error when stock is insufficient (allowOrdersWithoutStock is FALSE)', async () => {
      const mockCompany = { ...mockCompanyBase, allowOrdersWithoutStock: false };
      const mockCustomer = { ...mockCustomerBase, creditLimit: 10000, creditLimitUsed: 0 };
      const mockOrder = {
        ...mockOrderBase,
        status: OrderStatus.InApproval,
        customer: mockCustomer,
        orderItems: [{ ...mockOrderItemBase, quantity: 100, product: { ...mockProduct, stock: 10 } }],
      };

      companiesService.findOne.mockResolvedValue(mockCompany as Company);

      const ordersRepository = service.getModel();
      (ordersRepository.findOne as jest.Mock).mockResolvedValue(mockOrder);

      await expect(service.updateStatus(1, 1, { status: OrderStatus.Approved }, 1)).rejects.toThrow(BadRequestException);
    });

    it('ORD-016: should approve order and decrement stock when allowOrdersWithoutStock is FALSE and stock is sufficient', async () => {
      const mockCompany = { ...mockCompanyBase, allowOrdersWithoutStock: false };
      const mockCustomer = { ...mockCustomerBase, creditLimit: 10000, creditLimitUsed: 0 };
      const mockProductWithSave = { ...mockProduct, stock: 10, save: jest.fn().mockResolvedValue(true) };
      const mockOrder = {
        ...mockOrderBase,
        status: OrderStatus.InApproval,
        customer: mockCustomer,
        orderItems: [{ ...mockOrderItemBase, quantity: 5, product: mockProductWithSave }],
      };

      companiesService.findOne.mockResolvedValue(mockCompany as Company);

      const ordersRepository = service.getModel();
      (ordersRepository.findOne as jest.Mock).mockResolvedValue(mockOrder);
      (ordersRepository.update as jest.Mock).mockResolvedValue([1]);
      (ordersRepository.findAll as jest.Mock).mockResolvedValue([]);

      const result = await service.updateStatus(1, 1, { status: OrderStatus.Approved }, 1);

      expect(result.originalOrder.status).toBe(OrderStatus.Approved);
      expect(mockProductWithSave.save).toHaveBeenCalled();
    });
  });

  describe('Status Transitions', () => {
    it('ORD-017: should update status to Approved from InApproval', async () => {
      const mockCompany = { ...mockCompanyBase, allowOrdersWithoutStock: true };
      const mockCustomer = { ...mockCustomerBase, creditLimit: 10000, creditLimitUsed: 0 };
      const mockOrder = {
        ...mockOrderBase,
        status: OrderStatus.InApproval,
        customer: mockCustomer,
        orderItems: [{ ...mockOrderItemBase, product: { ...mockProduct, stock: 10 } }],
      };

      companiesService.findOne.mockResolvedValue(mockCompany as Company);

      const ordersRepository = service.getModel();
      (ordersRepository.findOne as jest.Mock).mockResolvedValue(mockOrder);
      (ordersRepository.update as jest.Mock).mockResolvedValue([1]);
      (ordersRepository.findAll as jest.Mock).mockResolvedValue([]);

      const result = await service.updateStatus(1, 1, { status: OrderStatus.Approved }, 1);
      expect(result.originalOrder.status).toBe(OrderStatus.Approved);
    });

    it('ORD-018: should throw error on invalid status transition', async () => {
      const mockCustomer = { ...mockCustomerBase };
      const mockOrder = {
        ...mockOrderBase,
        status: OrderStatus.Dispatched,
        customer: mockCustomer,
        orderItems: [mockOrderItemBase as OrderItem],
      };

      const ordersRepository = service.getModel();
      (ordersRepository.findOne as jest.Mock).mockResolvedValue(mockOrder);

      await expect(service.updateStatus(1, 1, { status: OrderStatus.InApproval }, 1)).rejects.toThrow(BadRequestException);
    });

    it('ORD-019: should throw error when trying to approve from wrong status', async () => {
      const mockCustomer = { ...mockCustomerBase };
      const mockOrder = {
        ...mockOrderBase,
        status: OrderStatus.Approved,
        customer: mockCustomer,
        orderItems: [mockOrderItemBase as OrderItem],
      };

      const ordersRepository = service.getModel();
      (ordersRepository.findOne as jest.Mock).mockResolvedValue(mockOrder);

      await expect(service.updateStatus(1, 1, { status: OrderStatus.Approved }, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Customer Status Validation', () => {
    it('should throw error when customer is inactive', async () => {
      const inactiveCustomer = { ...mockCustomerBase, status: CustomerStatus.Inactive };
      customersService.findOne.mockResolvedValue(inactiveCustomer as Customer);

      await expect(
        service.createOrder(
          1,
          { customerId: 1, paymentMethodId: 1, paymentConditionId: 1, discount: 0, isBudget: false, items: [{ productId: 1, quantity: 2, discount: 0 }] },
          { id: 1, email: 'test@test.com', role: UserRole.Administrator, companyId: 1, activeCompanyId: 1 }
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});
