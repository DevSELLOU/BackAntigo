import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CompaniesService } from 'src/companies/companies.service';
import { BaseCrudService, Paginated } from './base-crud.service';
import {
  ScheduledVisit,
  ScheduledVisitStatus,
} from './entities/scheduled-visit.entity';
import {
  CreateScheduledVisitDto,
  UpdateScheduledVisitDto,
} from './dtos/scheduled-visit.dto';
import { UserCompany } from 'src/user-companies/user-company.entity';
import { UserCompanyStatus } from 'src/user-companies/enums/user-company-status.enum';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { UserStatus } from 'src/users/enums/user-status.enum';
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

  async create(
    companyId: number,
    dto: CreateScheduledVisitDto,
  ): Promise<ScheduledVisit> {
    await this.assertCompanyExists(companyId);
    const customer = await Customer.findOne({
      where: { id: dto.customerId, companyId },
    });
    const responsible = await UserCompany.findOne({
      include: [
        {
          model: User,
          required: true,
          attributes: ['id'],
          where: { status: UserStatus.Active },
        },
      ],
      where: {
        userId: dto.userId,
        companyId,
        status: UserCompanyStatus.ACTIVE,
        role: { [Op.in]: getRolesAccessibleByRole(UserRole.SalesRep) },
      },
    });
    if (!customer || !responsible) {
      throw new BadRequestException(
        'Cliente e responsável devem pertencer à empresa e o responsável deve estar ativo',
      );
    }
    return this.repository.create({
      companyId,
      customerId: dto.customerId,
      userId: dto.userId,
      scheduledDate: dto.scheduledDate,
      scheduledTime: dto.scheduledTime,
      notes: dto.notes,
      status: ScheduledVisitStatus.PENDING,
    });
  }

  async findMyDay(
    companyId: number,
    userId: number,
    date: string,
  ): Promise<Paginated<ScheduledVisit>> {
    await this.assertCompanyExists(companyId);
    const data = await this.repository.findAll({
      where: {
        companyId,
        userId,
        scheduledDate: date,
        status: ScheduledVisitStatus.PENDING,
      },
      include: [
        { model: Customer, attributes: ['id', 'fantasyName', 'corporateName'] },
      ],
      order: [
        ['scheduledTime', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { data, metadata: { total: data.length } };
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
