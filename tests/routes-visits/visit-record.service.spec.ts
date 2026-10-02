import { Test, TestingModule } from '@nestjs/testing';
import { VisitRecordService } from '../../src/routes-visits/visit-record.service';
import { CompaniesService } from '../../src/companies/companies.service';
import { VisitSource } from '../../src/routes-visits/enums/visit-source.enum';
import { TripStatus } from '../../src/routes-visits/enums/trip-status.enum';

describe('VisitRecordService', () => {
  let service: VisitRecordService;
  let companiesService: jest.Mocked<CompaniesService>;
  let visitRecordsRepository: { create: jest.Mock };
  let tripsRepository: { findOne: jest.Mock };

  const mockCompanyId = 1;
  const mockCustomerId = 10;
  const mockUserId = 1;

  beforeEach(async () => {
    visitRecordsRepository = { create: jest.fn() };
    tripsRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitRecordService,
        { provide: CompaniesService, useValue: { findOne: jest.fn().mockResolvedValue({ id: mockCompanyId }) } },
        { provide: 'VISIT_RECORD_REPOSITORY', useValue: visitRecordsRepository },
        { provide: 'TRIP_REPOSITORY', useValue: tripsRepository },
      ],
    }).compile();

    service = module.get<VisitRecordService>(VisitRecordService);
    companiesService = module.get(CompaniesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFromOrder', () => {
    it('RV-VISIT-001: deve criar visita vinculada a trip ativa quando cliente está em rota', async () => {
      tripsRepository.findOne.mockResolvedValue({ id: 5, customerIds: [mockCustomerId] });
      visitRecordsRepository.create.mockResolvedValue({
        id: 1,
        tripId: 5,
        customerId: mockCustomerId,
        source: VisitSource.ORDER,
        isOutsideRoute: false,
      });

      const result = await service.createFromOrder(
        mockCompanyId,
        mockCustomerId,
        mockUserId,
        VisitSource.ORDER,
      );

      expect(tripsRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: mockCompanyId,
            userId: mockUserId,
            status: TripStatus.IN_PROGRESS,
          }),
        }),
      );
      expect(visitRecordsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: 5,
          customerId: mockCustomerId,
          source: VisitSource.ORDER,
          isOutsideRoute: false,
        }),
      );
    });

    it('RV-VISIT-002: deve criar visita como "fora da rota" quando não há trip ativa', async () => {
      tripsRepository.findOne.mockResolvedValue(null);
      visitRecordsRepository.create.mockResolvedValue({
        id: 2,
        tripId: null,
        customerId: mockCustomerId,
        source: VisitSource.ORDER,
        isOutsideRoute: true,
      });

      const result = await service.createFromOrder(
        mockCompanyId,
        mockCustomerId,
        mockUserId,
        VisitSource.QUOTE,
      );

      expect(visitRecordsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: null,
          isOutsideRoute: true,
          source: VisitSource.QUOTE,
        }),
      );
    });
  });
});
