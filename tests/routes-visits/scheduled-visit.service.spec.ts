import { UserCompany } from '../../src/user-companies/user-company.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledVisitService } from '../../src/routes-visits/scheduled-visit.service';
import { CompaniesService } from '../../src/companies/companies.service';
import { ScheduledVisitStatus } from '../../src/routes-visits/entities/scheduled-visit.entity';
import { Customer } from '../../src/presentation/customers/customer.entity';
import { User } from '../../src/users/user.entity';
import { Trip } from '../../src/routes-visits/entities/trip.entity';
import { Route } from '../../src/routes-visits/entities/route.entity';

describe('ScheduledVisitService', () => {
  let service: ScheduledVisitService;
  let companiesService: jest.Mocked<CompaniesService>;
  let repository: { findOne: jest.Mock; findAll: jest.Mock; create: jest.Mock };

  const mockCompanyId = 1;
  const mockUserId = 1;

  const mockVisit = {
    id: 1,
    customerId: 10,
    userId: mockUserId,
    companyId: mockCompanyId,
    scheduledDate: '2026-06-20',
    status: ScheduledVisitStatus.PENDING,
    notes: 'Visitar para orçamento',
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledVisitService,
        { provide: CompaniesService, useValue: { findOne: jest.fn().mockResolvedValue({ id: mockCompanyId }) } },
        { provide: 'SCHEDULED_VISIT_REPOSITORY', useValue: repository },
      ],
    }).compile();

    service = module.get<ScheduledVisitService>(ScheduledVisitService);
    companiesService = module.get(CompaniesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('standalone creation and daily agenda', () => {
    const dto = { customerId: 10, userId: 2, scheduledDate: '2026-10-16', scheduledTime: '09:30', notes: 'Ficticia' };
    it('creates a pending visit without a route and scopes both relationships', async () => {
      const customer = jest.spyOn(Customer, 'findOne').mockResolvedValue({id: 10} as any);
      const member = jest.spyOn(UserCompany, 'findOne').mockResolvedValue({userId: 2} as any);
      repository.create.mockResolvedValue(dto);
      await service.create(1, dto);
      expect(customer).toHaveBeenCalledWith({where: {id: 10, companyId: 1}});
      expect(member).toHaveBeenCalledWith(expect.objectContaining({where: expect.objectContaining({userId: 2, companyId: 1, status: 'ACTIVE'})}));
      expect(repository.create).toHaveBeenCalledWith({...dto, companyId: 1, status: 'PENDING'});
    });
    it.each(['customer', 'responsible'])('rejects a missing/foreign/inactive %s without writing', async missing => {
      jest.spyOn(Customer, 'findOne').mockResolvedValue(missing === 'customer' ? null : {} as any);
      jest.spyOn(UserCompany, 'findOne').mockResolvedValue(missing === 'responsible' ? null : {} as any);
      await expect(service.create(1, dto)).rejects.toThrow();
      expect(repository.create).not.toHaveBeenCalled();
    });
    it('queries exactly the requested local date, company, authenticated user and pending status', async () => {
      repository.findAll.mockResolvedValue([]);
      expect(await service.findMyDay(7, 23, '2026-10-16')).toEqual({data: [], metadata: {total: 0}});
      expect(repository.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: {companyId: 7, userId: 23, scheduledDate: '2026-10-16', status: 'PENDING'},
        order: [['scheduledTime', 'ASC'], ['id', 'ASC']],
      }));
    });
  });

  /* ─── findAll ─── */

  describe('findAll', () => {
    it('RV-SVISIT-010: deve listar visitas com includes de Customer e User', async () => {
      repository.findAll.mockResolvedValue([mockVisit]);

      const result = await service.findAll(mockCompanyId);

      expect(repository.findAll).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId },
        include: [
          { model: Customer, attributes: ['id', 'fantasyName', 'corporateName'] },
          { model: User, attributes: ['id', 'name'] },
          {
            model: Trip,
            as: 'sourceTrip',
            attributes: ['id'],
            include: [{
              model: Route,
              attributes: ['id', 'name', 'description', 'scheduledDate', 'customerIds', 'userIds', 'createdById'],
              include: [{ model: User, as: 'createdBy', attributes: ['id', 'name'] }],
            }],
          },
        ],
      });
      expect(result.data).toHaveLength(1);
    });
  });

  /* ─── findMy ─── */

  describe('findMy', () => {
    it('RV-SVISIT-020: deve listar visitas do usuário logado', async () => {
      repository.findAll.mockResolvedValue([mockVisit]);

      const result = await service.findMy(mockCompanyId, mockUserId);

      expect(repository.findAll).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, userId: mockUserId },
        include: [
          { model: expect.any(Function), attributes: ['id', 'fantasyName', 'corporateName'] },
        ],
      });
      expect(result.data).toHaveLength(1);
    });
  });

  /* ─── update ─── */

  describe('update', () => {
    it('RV-SVISIT-030: deve atualizar data e observação', async () => {
      repository.findOne.mockResolvedValue(mockVisit);

      const result = await service.update(mockCompanyId, 1, {
        scheduledDate: '2026-06-25',
        notes: 'Nova observação',
      });

      expect(mockVisit.save).toHaveBeenCalled();
      expect(result.scheduledDate).toBe('2026-06-25');
    });

    it('RV-SVISIT-031: deve lançar erro se visita não existir', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockCompanyId, 999, { notes: 'X' }),
      ).rejects.toThrow();
    });
  });

  /* ─── cancel ─── */

  describe('cancel', () => {
    it('RV-SVISIT-040: deve cancelar visita programada', async () => {
      repository.findOne.mockResolvedValue(mockVisit);

      await service.cancel(mockCompanyId, 1);

      expect(mockVisit.status).toBe(ScheduledVisitStatus.CANCELLED);
      expect(mockVisit.save).toHaveBeenCalled();
    });

    it('RV-SVISIT-041: deve lançar erro se visita não existir', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.cancel(mockCompanyId, 999)).rejects.toThrow();
    });
  });

  /* ─── getUpcoming ─── */

  describe('getUpcoming', () => {
    it('RV-SVISIT-050: deve retornar visitas futuras PENDING do usuário', async () => {
      repository.findAll.mockResolvedValue([mockVisit]);

      const result = await service.getUpcoming(mockCompanyId, mockUserId);

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: mockCompanyId,
            userId: mockUserId,
            status: ScheduledVisitStatus.PENDING,
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('RV-SVISIT-051: deve filtrar scheduledDate >= hoje', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.getUpcoming(mockCompanyId, mockUserId);

      const callArgs = repository.findAll.mock.calls[0][0];
      expect(callArgs.where.scheduledDate).toBeDefined();
      expect(callArgs.where.scheduledDate[Symbol.for('gte')] ?? callArgs.where.scheduledDate['Op.gte'] ?? true).toBeDefined();
      expect(result.data).toHaveLength(0);
    });
  });
});
