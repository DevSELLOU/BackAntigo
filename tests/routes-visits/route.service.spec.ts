import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RouteService } from '../../src/routes-visits/route.service';
import { CompaniesService } from '../../src/companies/companies.service';
import { CustomersService } from '../../src/presentation/customers/customers.service';
import { User } from '../../src/users/user.entity';

describe('RouteService', () => {
  let service: RouteService;
  let companiesService: jest.Mocked<CompaniesService>;
  let customersService: jest.Mocked<CustomersService>;
  let routesRepository: { findOne: jest.Mock; findAll: jest.Mock; create: jest.Mock; destroy: jest.Mock };

  const mockCompanyId = 1;
  const mockUserId = 1;

  const mockRoute = {
    id: 1,
    name: 'Rota Teste',
    customerIds: [10, 20],
    description: 'Descrição',
    scheduledDate: '2026-06-16',
    userIds: [mockUserId],
    companyId: mockCompanyId,
    isFixed: false,
    createdById: mockUserId,
    save: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    routesRepository = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteService,
        { provide: CompaniesService, useValue: { findOne: jest.fn().mockResolvedValue({ id: mockCompanyId }) } },
        { provide: CustomersService, useValue: { findOne: jest.fn().mockResolvedValue({ id: 10 }) } },
        { provide: 'ROUTE_REPOSITORY', useValue: routesRepository },
      ],
    }).compile();

    service = module.get<RouteService>(RouteService);
    companiesService = module.get(CompaniesService);
    customersService = module.get(CustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /* ─── create ─── */

  describe('create', () => {
    it('RV-ROUTE-001: deve criar rota com todos os campos', async () => {
      customersService.findOne.mockResolvedValue({ id: 10 } as any);
      routesRepository.create.mockResolvedValue(mockRoute);

      const result = await service.create(mockCompanyId, {
        name: 'Rota Teste',
        customerIds: [10, 20],
        description: 'Descrição',
        scheduledDate: '2026-06-16',
        userIds: [mockUserId],
        isFixed: false,
      }, mockUserId);

      expect(routesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Rota Teste',
          customerIds: [10, 20],
          isFixed: false,
          createdById: mockUserId,
          companyId: mockCompanyId,
        }),
      );
      expect(result).toEqual(mockRoute);
    });

    it('RV-ROUTE-002: deve criar rota fixa', async () => {
      routesRepository.create.mockResolvedValue({ ...mockRoute, isFixed: true });

      const result = await service.create(mockCompanyId, {
        name: 'Rota Fixa',
        isFixed: true,
      }, mockUserId);

      expect(routesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isFixed: true }),
      );
    });

    it('RV-ROUTE-003: deve lançar erro para IDs de clientes duplicados', async () => {
      await expect(
        service.create(mockCompanyId, {
          name: 'Rota Inválida',
          customerIds: [10, 10],
        }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('RV-ROUTE-004: deve lançar erro se customerId não existir', async () => {
      customersService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(
        service.create(mockCompanyId, {
          name: 'Rota Inválida',
          customerIds: [999],
        }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /* ─── findAll ─── */

  describe('findAll', () => {
    it('RV-ROUTE-040: deve listar todas as rotas da empresa', async () => {
      routesRepository.findAll.mockResolvedValue([mockRoute]);

      const result = await service.findAll(mockCompanyId);

      expect(routesRepository.findAll).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId },
        include: [
          { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        ],
      });
      expect(result.data).toEqual([mockRoute]);
    });
  });

  /* ─── findOne ─── */

  describe('findOne', () => {
    it('RV-ROUTE-050: deve retornar rota por ID', async () => {
      routesRepository.findOne.mockResolvedValue(mockRoute);

      const result = await service.findOne(mockCompanyId, 1);

      expect(result).toEqual(mockRoute);
    });

    it('RV-ROUTE-051: deve lançar erro se rota não existir', async () => {
      routesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockCompanyId, 999)).rejects.toThrow();
    });
  });

  /* ─── update ─── */

  describe('update', () => {
    it('RV-ROUTE-060: deve atualizar campos da rota', async () => {
      routesRepository.findOne.mockResolvedValue(mockRoute);

      const result = await service.update(mockCompanyId, 1, {
        name: 'Rota Atualizada',
        description: 'Nova descrição',
        customerIds: [10, 20, 30],
        scheduledDate: '2026-06-20',
        userIds: [mockUserId],
      });

      expect(mockRoute.save).toHaveBeenCalled();
      expect(result.name).toBe('Rota Atualizada');
    });

    it('RV-ROUTE-061: deve lançar erro se rota não existir', async () => {
      routesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockCompanyId, 999, { name: 'X' }),
      ).rejects.toThrow();
    });

    it('RV-ROUTE-062: deve lançar erro se customerId não existir no update', async () => {
      routesRepository.findOne.mockResolvedValue(mockRoute);
      customersService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(
        service.update(mockCompanyId, 1, { name: 'Rota', customerIds: [999] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /* ─── repeat ─── */

  describe('repeat', () => {
    it('RV-ROUTE-010: deve clonar rota existente com nova data', async () => {
      routesRepository.findOne.mockResolvedValue(mockRoute);
      routesRepository.create.mockResolvedValue({ ...mockRoute, id: 2, scheduledDate: '2026-06-23' });

      const result = await service.repeat(mockCompanyId, 1, '2026-06-23');

      expect(routesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, companyId: mockCompanyId },
      });
      expect(routesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockRoute.name,
          customerIds: mockRoute.customerIds,
          scheduledDate: '2026-06-23',
          isFixed: false,
          createdById: mockUserId,
        }),
      );
    });

    it('RV-ROUTE-011: deve lançar erro se rota original não existir', async () => {
      routesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.repeat(mockCompanyId, 999, '2026-06-23'),
      ).rejects.toThrow();
    });
  });

  /* ─── findMy ─── */

  describe('findMy', () => {
    it('RV-ROUTE-020: deve retornar rotas atribuídas OU criadas pelo usuário', async () => {
      routesRepository.findAll.mockResolvedValue([mockRoute]);

      const result = await service.findMy(mockCompanyId, mockUserId);

      expect(routesRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: mockCompanyId,
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });
  });

  /* ─── remove ─── */

  describe('remove', () => {
    it('RV-ROUTE-030: deve excluir rota existente', async () => {
      routesRepository.findOne.mockResolvedValue(mockRoute);

      const result = await service.remove(mockCompanyId, 1);

      expect(mockRoute.destroy).toHaveBeenCalled();
      expect(result.message).toBe('Rota excluída com sucesso');
    });
  });
});
