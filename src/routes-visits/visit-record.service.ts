import { Inject, Injectable } from '@nestjs/common';
import { CompaniesService } from 'src/companies/companies.service';
import { VisitRecord } from './entities/visit-record.entity';
import { VisitSource } from './enums/visit-source.enum';
import { Trip } from './entities/trip.entity';
import { TripStatus } from './enums/trip-status.enum';
import { Op } from 'sequelize';

@Injectable()
export class VisitRecordService {
  constructor(
    @Inject('VISIT_RECORD_REPOSITORY')
    private readonly visitRecordsRepository: typeof VisitRecord,
    @Inject('TRIP_REPOSITORY')
    private readonly tripsRepository: typeof Trip,
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
  ) {}

  async createFromOrder(
    companyId: number,
    customerId: number,
    userId: number,
    source: VisitSource.ORDER | VisitSource.QUOTE,
  ): Promise<VisitRecord> {
    await this.companiesService.findOne(companyId);

    const activeTrip = await this.tripsRepository.findOne({
      where: {
        companyId,
        userId,
        customerIds: { [Op.contains]: [customerId] },
        status: TripStatus.IN_PROGRESS,
      },
    });

    return this.visitRecordsRepository.create({
      tripId: activeTrip?.id || null,
      customerId,
      timestamp: new Date(),
      userId,
      companyId,
      source,
      isOutsideRoute: !activeTrip,
      scheduledNextVisit: null,
      notes: activeTrip
        ? 'Visita gerada automaticamente por pedido/orçamento durante a rota'
        : 'Visita gerada automaticamente por pedido/orçamento fora da rota',
    });
  }
}
