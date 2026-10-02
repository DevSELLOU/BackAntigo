import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TripService } from '../../src/routes-visits/trip.service';
import { CompaniesService } from '../../src/companies/companies.service';
import { CustomersService } from '../../src/presentation/customers/customers.service';
import { UsersService } from '../../src/users/users.service';
import { TripStatus } from '../../src/routes-visits/enums/trip-status.enum';
import { VisitSource } from '../../src/routes-visits/enums/visit-source.enum';

describe('TripService', () => {
  let service: TripService;
  let companiesService: jest.Mocked<CompaniesService>;
  let customersService: jest.Mocked<CustomersService>;
  let usersService: jest.Mocked<UsersService>;
  let tripsRepository: { findOne: jest.Mock; findAll: jest.Mock; create: jest.Mock };
  let routesRepository: { findOne: jest.Mock };
  let visitRecordsRepository: { create: jest.Mock; findAll: jest.Mock };
  let scheduledVisitRepository: { create: jest.Mock };

  const mockCompanyId = 1;
  const mockUserId = 1;

  let mockTrip: {
    id: number;
    customerIds: number[];
    status: TripStatus;
    scheduledDate: string;
    routeId: number;
    userId: number;
    companyId: number;
    completionNote: string | null;
    dailyLimit: number | null;
    overflow: boolean;
    save: jest.Mock;
    start: jest.Mock;
    assertInProgress: jest.Mock;
    complete: jest.Mock;
    validateCustomerBelongs: jest.Mock;
  };

  function buildMockTrip(overrides: Partial<typeof mockTrip> = {}): typeof mockTrip {
    const trip: any = {
      id: 1,
      customerIds: [10, 20, 30],
      status: TripStatus.PENDING,
      scheduledDate: '2026-06-16',
      routeId: 1,
      userId: mockUserId,
      companyId: mockCompanyId,
      completionNote: null,
      dailyLimit: null,
      overflow: false,
      save: jest.fn().mockResolvedValue(undefined),
      start: jest.fn(function (this: any) {
        if (this.status !== TripStatus.PENDING) {
          throw new BadRequestException('A viagem não está no status PENDING');
        }
        this.status = TripStatus.IN_PROGRESS;
      }),
      assertInProgress: jest.fn(function (this: any) {
        if (this.status !== TripStatus.IN_PROGRESS) {
          throw new BadRequestException('A viagem precisa estar em andamento');
        }
      }),
      complete: jest.fn(function (this: any, context: { status: TripStatus; completionNote?: string }) {
        if (this.status !== TripStatus.IN_PROGRESS && this.status !== TripStatus.PENDING) {
          throw new BadRequestException('A viagem não pode ser finalizada no status atual');
        }
        if (context.status === TripStatus.INCOMPLETE && !context.completionNote) {
          throw new BadRequestException('Observação obrigatória para finalização incompleta');
        }
        this.status = context.status;
        if (context.completionNote) {
          this.completionNote = context.completionNote;
        }
      }),
      validateCustomerBelongs: jest.fn(function (this: any, customerId: number) {
        if (!this.customerIds?.includes(customerId)) {
          throw new BadRequestException('Cliente não pertence a esta viagem');
        }
      }),
    };
    return { ...trip, ...overrides, save: jest.fn().mockResolvedValue(undefined) };
  }

  beforeEach(() => {
    mockTrip = buildMockTrip();
  });

  const mockRoute = {
    id: 1,
    name: 'Rota Teste',
    customerIds: [10, 20, 30],
    companyId: mockCompanyId,
  };

  const mockVisitRecord = {
    id: 1,
    tripId: 1,
    customerId: 10,
    timestamp: new Date(),
    userId: mockUserId,
    companyId: mockCompanyId,
    source: VisitSource.ROUTE,
    isOutsideRoute: false,
    scheduledNextVisit: '2026-07-01',
  };

  beforeEach(async () => {
    tripsRepository = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    };

    routesRepository = {
      findOne: jest.fn(),
    };

    visitRecordsRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
    };

    scheduledVisitRepository = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripService,
        { provide: CompaniesService, useValue: { findOne: jest.fn().mockResolvedValue({ id: mockCompanyId }) } },
        { provide: CustomersService, useValue: { findOne: jest.fn().mockResolvedValue({ id: 10 }) } },
        { provide: UsersService, useValue: { findOneWithNoRole: jest.fn().mockResolvedValue({ id: mockUserId }) } },
        { provide: 'TRIP_REPOSITORY', useValue: tripsRepository },
        { provide: 'ROUTE_REPOSITORY', useValue: routesRepository },
        { provide: 'VISIT_RECORD_REPOSITORY', useValue: visitRecordsRepository },
        { provide: 'SCHEDULED_VISIT_REPOSITORY', useValue: scheduledVisitRepository },
      ],
    }).compile();

    service = module.get<TripService>(TripService);
    companiesService = module.get(CompaniesService);
    customersService = module.get(CustomersService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /* ─── createFromRoute ─── */

  describe('createFromRoute', () => {
    it('RV-TRIP-001: deve criar uma trip a partir de uma rota', async () => {
      routesRepository.findOne.mockResolvedValue(mockRoute);
      tripsRepository.create.mockResolvedValue(mockTrip);

      const result = await service.createFromRoute(mockCompanyId, {
        routeId: 1,
        userId: mockUserId,
      });

      expect(routesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, companyId: mockCompanyId },
      });
      expect(tripsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerIds: [10, 20, 30],
          routeId: 1,
          userId: mockUserId,
          companyId: mockCompanyId,
        }),
      );
      expect(result).toEqual(mockTrip);
    });

    it('RV-TRIP-002: deve criar uma trip avulsa (sem routeId)', async () => {
      tripsRepository.create.mockResolvedValue({ ...mockTrip, routeId: null, customerIds: [] });

      const result = await service.createFromRoute(mockCompanyId, {
        routeId: null,
        userId: mockUserId,
      });

      expect(routesRepository.findOne).not.toHaveBeenCalled();
      expect(tripsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerIds: [],
          routeId: null,
          userId: mockUserId,
        }),
      );
    });

    it('RV-TRIP-003: deve lançar erro se a rota não existir', async () => {
      routesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createFromRoute(mockCompanyId, {
          routeId: 999,
          userId: mockUserId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('RV-TRIP-004: deve dividir clientes entre dias quando dailyLimit for definido', async () => {
      routesRepository.findOne.mockResolvedValue(mockRoute);
      tripsRepository.create.mockResolvedValue(mockTrip);

      const result = await service.createFromRoute(mockCompanyId, {
        routeId: 1,
        userId: mockUserId,
        dailyLimit: 2,
      });

      expect(tripsRepository.create).toHaveBeenCalledTimes(2);
      // First call: today's trip with first 2 customers
      expect(tripsRepository.create).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          customerIds: [10, 20],
          dailyLimit: 2,
        }),
      );
      // Second call: overflow trip with remaining customer
      expect(tripsRepository.create).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          customerIds: [30],
          dailyLimit: 2,
          overflow: true,
        }),
      );
      expect(result).toEqual(mockTrip);
    });

    it('RV-TRIP-005: não deve criar overflow se dailyLimit cobrir todos', async () => {
      routesRepository.findOne.mockResolvedValue(mockRoute);
      tripsRepository.create.mockResolvedValue(mockTrip);

      await service.createFromRoute(mockCompanyId, {
        routeId: 1,
        userId: mockUserId,
        dailyLimit: 5,
      });

      expect(tripsRepository.create).toHaveBeenCalledTimes(1);
    });
  });

  /* ─── start ─── */

  describe('start', () => {
    it('RV-TRIP-010: deve iniciar uma trip PENDING', async () => {
      const trip = { ...mockTrip, save: jest.fn().mockResolvedValue(true) };
      tripsRepository.findOne.mockResolvedValue(trip);

      const result = await service.start(mockCompanyId, 1);

      expect(trip.status).toBe(TripStatus.IN_PROGRESS);
      expect(trip.save).toHaveBeenCalled();
      expect(result).toEqual(trip);
    });

    it('RV-TRIP-011: deve lançar erro se trip não estiver PENDING', async () => {
      tripsRepository.findOne.mockResolvedValue({ ...mockTrip, status: TripStatus.COMPLETED });

      await expect(service.start(mockCompanyId, 1)).rejects.toThrow(BadRequestException);
    });
  });

  /* ─── checkIn ─── */

  describe('checkIn', () => {
    it('RV-TRIP-020: deve registrar check-in e criar visita programada', async () => {
      const trip = {
        ...mockTrip,
        status: TripStatus.IN_PROGRESS,
        save: jest.fn().mockResolvedValue(true),
      };
      tripsRepository.findOne.mockResolvedValue(trip);
      visitRecordsRepository.create.mockResolvedValue(mockVisitRecord);
      scheduledVisitRepository.create.mockResolvedValue({ id: 1 });

      const result = await service.checkIn(mockCompanyId, 1, {
        customerId: 10,
        notes: 'Visita realizada',
        scheduledNextVisit: '2026-07-01',
      }, mockUserId);

      expect(visitRecordsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 10,
          source: VisitSource.ROUTE,
          isOutsideRoute: false,
          scheduledNextVisit: '2026-07-01',
          companyId: mockCompanyId,
          userId: mockUserId,
          notes: 'Visita realizada',
        }),
      );

      expect(scheduledVisitRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 10,
          scheduledDate: '2026-07-01',
          userId: mockUserId,
          companyId: mockCompanyId,
        }),
      );

      expect(result).toEqual(mockVisitRecord);
    });

    it('RV-TRIP-021: deve lançar erro se trip não estiver IN_PROGRESS', async () => {
      tripsRepository.findOne.mockResolvedValue({ ...mockTrip, status: TripStatus.PENDING });

      await expect(
        service.checkIn(mockCompanyId, 1, { customerId: 10, scheduledNextVisit: '2026-07-01' }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /* ─── complete ─── */

  describe('complete', () => {
    it('RV-TRIP-030: deve finalizar trip como COMPLETED', async () => {
      const trip = {
        ...mockTrip,
        status: TripStatus.IN_PROGRESS,
        save: jest.fn().mockResolvedValue(true),
      };
      tripsRepository.findOne.mockResolvedValue(trip);

      const result = await service.complete(mockCompanyId, 1, {
        status: TripStatus.COMPLETED,
      }, mockUserId);

      expect(trip.status).toBe(TripStatus.COMPLETED);
      expect(trip.save).toHaveBeenCalled();
    });

    it('RV-TRIP-031: deve finalizar trip como INCOMPLETE com observação', async () => {
      const trip = {
        ...mockTrip,
        status: TripStatus.IN_PROGRESS,
        save: jest.fn().mockResolvedValue(true),
      };
      tripsRepository.findOne.mockResolvedValue(trip);

      const result = await service.complete(mockCompanyId, 1, {
        status: TripStatus.INCOMPLETE,
        completionNote: 'Cliente não encontrado',
      }, mockUserId);

      expect(trip.status).toBe(TripStatus.INCOMPLETE);
      expect(trip.completionNote).toBe('Cliente não encontrado');
      expect(trip.save).toHaveBeenCalled();
    });

    it('RV-TRIP-032: deve lançar erro se INCOMPLETE sem observação', async () => {
      const trip = {
        ...mockTrip,
        status: TripStatus.IN_PROGRESS,
        save: jest.fn().mockResolvedValue(true),
      };
      tripsRepository.findOne.mockResolvedValue(trip);

      await expect(
        service.complete(mockCompanyId, 1, {
          status: TripStatus.INCOMPLETE,
          completionNote: '',
        }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('RV-TRIP-033: deve lançar erro se trip não está em andamento', async () => {
      tripsRepository.findOne.mockResolvedValue({ ...mockTrip, status: TripStatus.COMPLETED });

      await expect(
        service.complete(mockCompanyId, 1, { status: TripStatus.COMPLETED }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /* ─── skipCustomer ─── */

  describe('skipCustomer', () => {
    it('RV-TRIP-040: deve pular cliente e criar visita programada', async () => {
      const trip = {
        ...mockTrip,
        status: TripStatus.IN_PROGRESS,
        customerIds: [10, 20, 30],
        save: jest.fn(),
      };
      tripsRepository.findOne.mockResolvedValue(trip);
      scheduledVisitRepository.create.mockResolvedValue({ id: 1 });

      const result = await service.skipCustomer(mockCompanyId, 1, {
        customerId: 20,
        scheduledNextVisit: '2026-07-15',
        notes: 'Cliente fechado',
      }, mockUserId);

      expect(scheduledVisitRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 20,
          scheduledDate: '2026-07-15',
          notes: 'Cliente fechado',
        }),
      );
    });

    it('RV-TRIP-041: deve lançar erro se cliente não pertence à trip', async () => {
      tripsRepository.findOne.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.IN_PROGRESS,
        customerIds: [10, 20],
      });

      await expect(
        service.skipCustomer(mockCompanyId, 1, {
          customerId: 99,
          scheduledNextVisit: '2026-07-15',
        }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /* ─── findAllVisitRecords ─── */

  describe('findAllVisitRecords', () => {
    it('RV-TRIP-050: deve retornar todos os registros de visita da empresa', async () => {
      visitRecordsRepository.findAll.mockResolvedValue([mockVisitRecord]);

      const result = await service.findAllVisitRecords(mockCompanyId);

      expect(visitRecordsRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: mockCompanyId },
        }),
      );
      expect(result.data).toHaveLength(1);
    });
  });
});
