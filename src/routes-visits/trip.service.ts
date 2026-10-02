import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CompaniesService } from 'src/companies/companies.service';
import { CustomersService } from 'src/presentation/customers/customers.service';
import { Customer } from 'src/presentation/customers/customer.entity';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';
import { Route } from './entities/route.entity';
import { Trip } from './entities/trip.entity';
import { VisitRecord } from './entities/visit-record.entity';
import { ScheduledVisit } from './entities/scheduled-visit.entity';
import { TripStatus } from './enums/trip-status.enum';
import { VisitSource } from './enums/visit-source.enum';
import { BaseCrudService, Paginated } from './base-crud.service';
import { CreateTripDto } from './dtos/create-trip.dto';
import { CheckInDto } from './dtos/check-in.dto';
import { CompleteTripDto } from './dtos/complete-trip.dto';
import { SkipCustomerDto } from './dtos/skip-customer.dto';

@Injectable()
export class TripService extends BaseCrudService<Trip> {
  constructor(
    @Inject('TRIP_REPOSITORY')
    repository: typeof Trip,
    @Inject(CompaniesService)
    companiesService: CompaniesService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject('VISIT_RECORD_REPOSITORY')
    private readonly visitRecordsRepository: typeof VisitRecord,
    @Inject('ROUTE_REPOSITORY')
    private readonly routesRepository: typeof Route,
    @Inject('SCHEDULED_VISIT_REPOSITORY')
    private readonly scheduledVisitRepository: typeof ScheduledVisit,
  ) {
    super(repository, companiesService);
  }

  private async createScheduledVisit(params: {
    customerId: number;
    userId: number;
    companyId: number;
    scheduledDate: string;
    sourceTripId: number;
    sourceVisitRecordId?: number;
    notes?: string;
  }): Promise<ScheduledVisit> {
    console.log('[SKIP_CREATE_SCHEDULED] creating with:', params);
    const sv = await this.scheduledVisitRepository.create({
      customerId: params.customerId,
      userId: params.userId,
      companyId: params.companyId,
      scheduledDate: params.scheduledDate,
      sourceTripId: params.sourceTripId,
      sourceVisitRecordId: params.sourceVisitRecordId ?? null,
      notes: params.notes ?? 'Cliente não visitado durante a rota',
      status: 'PENDING',
    });
    console.log('[SKIP_CREATE_SCHEDULED] created, id:', sv.id);
    return sv;
  }

  async createFromRoute(companyId: number, dto: CreateTripDto): Promise<Trip> {
    await this.assertCompanyExists(companyId);

    let customerIds: number[] = [];

    if (dto.routeId) {
      const route = await this.routesRepository.findOne({
        where: { id: dto.routeId, companyId },
      });
      if (!route) {
        throw new BadRequestException('Rota não encontrada');
      }
      customerIds = route.customerIds || [];
    }

    await this.usersService.findOneWithNoRole(dto.userId);

    // If daily limit is set, split customers
    if (dto.dailyLimit && customerIds.length > dto.dailyLimit) {
      const todayIds = customerIds.slice(0, dto.dailyLimit);
      const overflowIds = customerIds.slice(dto.dailyLimit);

      // Create today's trip
      const trip = await this.repository.create({
        customerIds: todayIds,
        status: TripStatus.PENDING,
        scheduledDate:
          dto.scheduledDate || new Date().toISOString().split('T')[0],
        routeId: dto.routeId || null,
        userId: dto.userId,
        companyId,
        dailyLimit: dto.dailyLimit,
      });

      // Create overflow trip for next day
      if (overflowIds.length > 0) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1);
        await this.repository.create({
          customerIds: overflowIds,
          status: TripStatus.PENDING,
          scheduledDate: nextDate.toISOString().split('T')[0],
          routeId: dto.routeId || null,
          userId: dto.userId,
          companyId,
          dailyLimit: dto.dailyLimit,
          overflow: true,
        });
      }

      return trip;
    }

    return this.repository.create({
      customerIds,
      status: TripStatus.PENDING,
      scheduledDate:
        dto.scheduledDate || new Date().toISOString().split('T')[0],
      routeId: dto.routeId || null,
      userId: dto.userId,
      companyId,
      dailyLimit: dto.dailyLimit,
    });
  }

  async start(companyId: number, id: number): Promise<Trip> {
    await this.assertCompanyExists(companyId);

    const trip = await this.findOneOrFail(
      { id, companyId },
      { include: ['route'], message: 'Viagem não encontrada' },
    );
    trip.start();
    await trip.save();
    return trip;
  }

  async checkIn(
    companyId: number,
    id: number,
    dto: CheckInDto,
    userId: number,
  ): Promise<VisitRecord> {
    await this.assertCompanyExists(companyId);

    const trip = await this.findOneOrFail(
      { id, companyId },
      { include: ['route', 'visitRecords'], message: 'Viagem não encontrada' },
    );

    await this.customersService.findOne(companyId, dto.customerId);
    trip.assertInProgress();

    const visitRecord = await this.visitRecordsRepository.create({
      tripId: trip.id,
      customerId: dto.customerId,
      timestamp: new Date(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      notes: dto.notes,
      userId,
      companyId,
      source: VisitSource.ROUTE,
      isOutsideRoute: false,
      scheduledNextVisit: dto.scheduledNextVisit,
    });

    if (dto.scheduledNextVisit) {
      await this.createScheduledVisit({
        customerId: dto.customerId,
        userId,
        companyId,
        scheduledDate: dto.scheduledNextVisit,
        sourceTripId: trip.id,
        sourceVisitRecordId: visitRecord.id,
      });
    }

    return visitRecord;
  }

  async complete(
    companyId: number,
    id: number,
    dto: CompleteTripDto,
    userId: number,
  ): Promise<Trip> {
    await this.assertCompanyExists(companyId);

    const trip = await this.findOneOrFail(
      { id, companyId },
      { message: 'Viagem não encontrada' },
    );

    trip.complete({ status: dto.status, completionNote: dto.completionNote });
    await trip.save();
    return trip;
  }

  async skipCustomer(
    companyId: number,
    id: number,
    dto: SkipCustomerDto,
    userId: number,
  ): Promise<ScheduledVisit> {
    console.log(
      '[SKIP_SERVICE] companyId:',
      companyId,
      'tripId:',
      id,
      'customerId:',
      dto.customerId,
      'userId:',
      userId,
    );

    await this.assertCompanyExists(companyId);
    console.log('[SKIP_SERVICE] company exists');

    const trip = await this.findOneOrFail(
      { id, companyId },
      { message: 'Viagem não encontrada' },
    );
    console.log(
      '[SKIP_SERVICE] trip found, status:',
      trip.status,
      'customerIds:',
      trip.customerIds,
    );

    trip.assertInProgress();
    console.log('[SKIP_SERVICE] assertInProgress OK');

    trip.validateCustomerBelongs(dto.customerId);
    console.log('[SKIP_SERVICE] validateCustomerBelongs OK');

    const scheduledVisit = await this.createScheduledVisit({
      customerId: dto.customerId,
      userId,
      companyId,
      scheduledDate: dto.scheduledNextVisit,
      sourceTripId: trip.id,
      notes: dto.notes,
    });
    console.log(
      '[SKIP_SERVICE] scheduledVisit created, id:',
      scheduledVisit.id,
    );
    return scheduledVisit;
  }

  async findAll(companyId: number): Promise<Paginated<Trip>> {
    await this.assertCompanyExists(companyId);
    const data = await this.repository.findAll({
      where: { companyId },
      include: [
        'route',
        'user',
        { model: VisitRecord, include: [{ model: User }] },
      ],
    });
    return { data, metadata: { total: data.length } };
  }

  async findMy(companyId: number, userId: number): Promise<Paginated<Trip>> {
    await this.assertCompanyExists(companyId);
    const data = await this.repository.findAll({
      where: { companyId, userId },
      include: ['route', { model: VisitRecord, include: [{ model: User }] }],
    });
    return { data, metadata: { total: data.length } };
  }

  async findOne(companyId: number, id: number): Promise<Trip> {
    await this.assertCompanyExists(companyId);
    const trip = await this.repository.findOne({
      where: { id, companyId },
      include: [
        'route',
        'user',
        { model: VisitRecord, include: [{ model: User }] },
        ScheduledVisit,
      ],
    });
    if (!trip) {
      throw new BadRequestException('Viagem não encontrada');
    }
    return trip;
  }

  async findVisitRecords(
    companyId: number,
    id: number,
  ): Promise<Paginated<VisitRecord>> {
    await this.assertCompanyExists(companyId);

    await this.findOneOrFail(
      { id, companyId },
      { message: 'Viagem não encontrada' },
    );

    const data = await this.visitRecordsRepository.findAll({
      where: { tripId: id },
      include: [Customer, User],
    });

    return { data, metadata: { total: data.length } };
  }

  async findVisitRecordsByCustomer(
    companyId: number,
    customerId: number,
  ): Promise<Paginated<VisitRecord>> {
    await this.assertCompanyExists(companyId);
    await this.customersService.findOne(companyId, customerId);

    const data = await this.visitRecordsRepository.findAll({
      where: { customerId },
      include: [Trip, User],
      order: [['timestamp', 'DESC']],
    });

    return { data, metadata: { total: data.length } };
  }

  async findAllVisitRecords(
    companyId: number,
  ): Promise<Paginated<VisitRecord>> {
    await this.assertCompanyExists(companyId);

    const data = await this.visitRecordsRepository.findAll({
      where: { companyId },
      include: [
        { model: Customer, attributes: ['id', 'fantasyName', 'corporateName'] },
        { model: User, attributes: ['id', 'name'] },
        {
          model: Trip,
          attributes: ['id', 'status'],
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
      ],
      order: [['timestamp', 'DESC']],
    });

    return { data, metadata: { total: data.length } };
  }
}
