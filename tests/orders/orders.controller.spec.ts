import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../../src/presentation/orders/orders.controller';
import { OrdersService } from '../../src/presentation/orders/orders.service';
import { ExportsService } from '../../src/exports/exports.service';
import { UserRole } from '../../src/users/enums/user-role.enum';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<OrdersService>;

  const mockOrder = {
    id: 1,
    companyId: 1,
    customerId: 1,
    status: 'on_budget',
    totalValue: 500,
    observation: 'Test order',
    customer: { id: 1, corporateName: 'Test Customer' },
    orderItems: [],
    responsibleUser: { id: 1, name: 'Test User' },
  };

  const mockAuthenticatedUser = {
    id: 1,
    email: 'test@example.com',
    role: UserRole.Administrator,
    companyId: 1,
    activeCompanyId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
            createOrder: jest.fn(),
            updateOrder: jest.fn(),
            deleteOrder: jest.fn(),
            updateStatus: jest.fn(),
            splitOrder: jest.fn(),
            updateAmountPaid: jest.fn(),
            exportOrderToPdf: jest.fn(),
          },
        },
        {
          provide: ExportsService,
          useValue: {
            exportData: jest.fn(),
            getSelectableFields: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get(OrdersService);
  });

  describe('findOne', () => {
    it('should return a single order by ID', async () => {
      ordersService.findOne.mockResolvedValue(mockOrder as any);

      const result = await controller.findOne(1, 1, mockAuthenticatedUser);

      expect(ordersService.findOne).toHaveBeenCalledWith(1, 1);
      expect(result.message).toBe('Pedido retornado com sucesso');
      expect(result.data).toEqual(mockOrder);
    });

    it('should log the request', async () => {
      ordersService.findOne.mockResolvedValue(mockOrder as any);

      await controller.findOne(1, 1, mockAuthenticatedUser);

      expect(ordersService.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      ordersService.findOne.mockRejectedValue(new Error('Pedido não encontrado'));

      await expect(controller.findOne(1, 999, mockAuthenticatedUser)).rejects.toThrow();
    });
  });
});