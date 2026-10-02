import { Inject, Injectable } from '@nestjs/common';
import { CompaniesService } from 'src/companies/companies.service';
import { BaseCrudService, Paginated } from './base-crud.service';
import {
  ScheduledVisit,
  ScheduledVisitStatus,
} from './entities/scheduled-visit.entity';
import { UpdateScheduledVisitDto } from './dtos/scheduled-visit.dto';
import { Op } from 'sequelize';
import { Customer } from 'src/presentation/customers/customer.entity';
import { User } from 'src/users/user.entity';
import { Route } from './entities/route.entity';
import { Trip } from './entities/trip.entity';

@Injectable()
export class ScheduledVisitService extends BaseCrudService<ScheduledVisit> {
  constructor(
    @Inject('SCHEDULED_VISIT_REPOSITORY')
    repository: typeof ScheduledVisit,
    @Inject(CompaniesService)
    companiesService: CompaniesService,
  ) {
    super(repository, companiesService);
  }

  async findAll(companyId: number): Promise<Paginated<ScheduledVisit>> {
    await this.assertCompanyExists(companyId);
    return this.list({ companyId }, [
      { model: Customer, attributes: ['id', 'fantasyName', 'corporateName'] },
      { model: User, attributes: ['id', 'name'] },
      {
        model: Trip,
        as: 'sourceTrip',
        attributes: ['id'],
        include: [
          {
            model: Route,
            attributes: [
              'id',
              'name',
              'description',
              'scheduledDate',
              'customerIds',
              'userIds',
              'createdById',
            ],
            include: [
              { model: User, as: 'createdBy', attributes: ['id', 'name'] },
            ],
          },
        ],
      },
    ]);
  }

  async findMy(
    companyId: number,
    userId: number,
  ): Promise<Paginated<ScheduledVisit>> {
    await this.assertCompanyExists(companyId);
    const data = await this.repository.findAll({
      where: { companyId, userId },
      include: [
        { model: Customer, attributes: ['id', 'fantasyName', 'corporateName'] },
      ],
    });
    return { data, metadata: { total: data.length } };
  }

  async update(
    companyId: number,
    id: number,
    dto: UpdateScheduledVisitDto,
  ): Promise<ScheduledVisit> {
    await this.assertCompanyExists(companyId);

    const visit = await this.findOneOrFail(
      { id, companyId },
      { message: 'Visita programada não encontrada' },
    );

    if (dto.scheduledDate !== undefined)
      visit.scheduledDate = dto.scheduledDate;
    if (dto.notes !== undefined) visit.notes = dto.notes;

    await visit.save();
    return visit;
  }

  async cancel(companyId: number, id: number): Promise<void> {
    await this.assertCompanyExists(companyId);

    const visit = await this.findOneOrFail(
      { id, companyId },
      { message: 'Visita programada não encontrada' },
    );

    visit.status = ScheduledVisitStatus.CANCELLED;
    await visit.save();
  }

  async getUpcoming(
    companyId: number,
    userId: number,
  ): Promise<Paginated<ScheduledVisit>> {
    await this.assertCompanyExists(companyId);
    const data = await this.repository.findAll({
      where: {
        companyId,
        userId,
        status: ScheduledVisitStatus.PENDING,
        scheduledDate: { [Op.gte]: new Date().toISOString().split('T')[0] },
      },
      include: [
        { model: Customer, attributes: ['id', 'fantasyName', 'corporateName'] },
      ],
      order: [['scheduledDate', 'ASC']],
    });
    return { data, metadata: { total: data.length } };
  }
}
