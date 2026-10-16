import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompanyOwnershipGuard } from 'src/auth/guards/company-ownership.guard';
import { AuthAdministrator } from 'src/auth/decorators/authenticated-user.decorator';
import { AuthenticatedUserDto } from 'src/auth/dtos/authenticated-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  UserRole,
  getRolesAccessibleByRole,
} from 'src/users/enums/user-role.enum';
import { RouteService } from './route.service';
import { TripService } from './trip.service';
import { CreateRouteDto } from './dtos/create-route.dto';
import { CreateTripDto } from './dtos/create-trip.dto';
import { CheckInDto } from './dtos/check-in.dto';
import { CompleteTripDto } from './dtos/complete-trip.dto';
import { SkipCustomerDto } from './dtos/skip-customer.dto';
import { CreateScheduledVisitDto, ScheduledVisitDayQuery, UpdateScheduledVisitDto } from './dtos/scheduled-visit.dto';
import { ScheduledVisitService } from './scheduled-visit.service';
import { logger } from 'src/utils/logger';

@Controller('company/:companyId/routes-visits')
@UseGuards(CompanyOwnershipGuard)
export class RoutesVisitsController {
  constructor(
    @Inject(RouteService)
    private readonly routeService: RouteService,
    @Inject(TripService)
    private readonly tripService: TripService,
    @Inject(ScheduledVisitService)
    private readonly scheduledVisitService: ScheduledVisitService,
  ) {}

  /* ─── routes ─── */

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Post('routes')
  async createRoute(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateRouteDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const route = await this.routeService.create(companyId, dto, user.id);
    return { message: 'Rota criada com sucesso', data: route };
  }

  @Get('routes')
  async findAllRoutes(@Param('companyId', ParseIntPipe) companyId: number) {
    const { data, metadata } = await this.routeService.findAll(companyId);
    return { message: 'Rotas encontradas', data, metadata };
  }

  @Get('routes/my-routes')
  async findMyRoutes(
    @Param('companyId', ParseIntPipe) companyId: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const { data, metadata } = await this.routeService.findMy(
      companyId,
      user.id,
    );
    return { message: 'Minhas rotas encontradas', data, metadata };
  }

  @Get('routes/:id')
  async findOneRoute(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const route = await this.routeService.findOne(companyId, id);
    return { message: 'Rota encontrada', data: route };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Patch('routes/:id')
  async updateRoute(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateRouteDto,
  ) {
    const route = await this.routeService.update(companyId, id, dto);
    return { message: 'Rota atualizada com sucesso', data: route };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Delete('routes/:id')
  async deleteRoute(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.routeService.remove(companyId, id);
    return { message: 'Rota excluída com sucesso', data: result };
  }

  /* ─── trips ─── */

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Post('trips')
  async createTrip(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateTripDto,
  ) {
    const trip = await this.tripService.createFromRoute(companyId, dto);
    return { message: 'Viagem criada com sucesso', data: trip };
  }

  @Get('trips')
  async findAllTrips(@Param('companyId', ParseIntPipe) companyId: number) {
    const { data, metadata } = await this.tripService.findAll(companyId);
    return { message: 'Viagens encontradas', data, metadata };
  }

  @Get('trips/my-trips')
  async findMyTrips(
    @Param('companyId', ParseIntPipe) companyId: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const { data, metadata } = await this.tripService.findMy(
      companyId,
      user.id,
    );
    return { message: 'Minhas viagens encontradas', data, metadata };
  }

  @Get('trips/:id')
  async findOneTrip(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const trip = await this.tripService.findOne(companyId, id);
    return { message: 'Viagem encontrada', data: trip };
  }

  @Get('trips/:id/visit-records')
  async findTripVisitRecords(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { data, metadata } = await this.tripService.findVisitRecords(
      companyId,
      id,
    );
    return { message: 'Registros de visita encontrados', data, metadata };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Patch('trips/:id/start')
  async startTrip(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const trip = await this.tripService.start(companyId, id);
    return { message: 'Viagem iniciada com sucesso', data: trip };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Patch('trips/:id/check-in')
  async checkIn(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckInDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const visitRecord = await this.tripService.checkIn(
      companyId,
      id,
      dto,
      user.id,
    );
    return { message: 'Check-in realizado com sucesso', data: visitRecord };
  }

  /* ─── visit records ─── */

  @Get('visit-records')
  async findVisitRecordsByCustomer(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('customerId', ParseIntPipe) customerId: number,
  ) {
    const { data, metadata } =
      await this.tripService.findVisitRecordsByCustomer(companyId, customerId);
    return { message: 'Registros de visita encontrados', data, metadata };
  }

  /* ─── trip completion ─── */

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Patch('trips/:id/complete')
  async completeTrip(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteTripDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const trip = await this.tripService.complete(companyId, id, dto, user.id);
    return { message: 'Viagem finalizada', data: trip };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Patch('trips/:id/skip-customer')
  async skipCustomer(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SkipCustomerDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    console.log(
      '[SKIP_CONTROLLER] companyId:',
      companyId,
      'tripId:',
      id,
      'customerId:',
      dto.customerId,
      'userId:',
      user.id,
    );
    const result = await this.tripService.skipCustomer(
      companyId,
      id,
      dto,
      user.id,
    );
    console.log('[SKIP_CONTROLLER] success, scheduledVisitId:', result.id);
    return { message: 'Cliente pulado', data: result };
  }

  /* ─── route repeat ─── */

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Post('routes/:id/repeat')
  async repeatRoute(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('scheduledDate') scheduledDate: string,
  ) {
    const route = await this.routeService.repeat(companyId, id, scheduledDate);
    return { message: 'Rota repetida com sucesso', data: route };
  }

  /* ─── scheduled visits ─── */

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Post('scheduled-visits')
  async createScheduledVisit(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateScheduledVisitDto,
  ) {
    const data = await this.scheduledVisitService.create(companyId, dto);
    return { message: 'Visita programada criada', data };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Get('scheduled-visits/my/day')
  async findMyDay(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() query: ScheduledVisitDayQuery,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const result = await this.scheduledVisitService.findMyDay(companyId, user.id, query.date);
    return { message: 'Compromissos do dia', ...result };
  }

  @Get('scheduled-visits')
  async findScheduledVisits(
    @Param('companyId', ParseIntPipe) companyId: number,
  ) {
    const { data, metadata } = await this.scheduledVisitService.findAll(
      companyId,
    );
    return { message: 'Visitas programadas encontradas', data, metadata };
  }

  @Get('scheduled-visits/my')
  async findMyScheduledVisits(
    @Param('companyId', ParseIntPipe) companyId: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const { data, metadata } = await this.scheduledVisitService.findMy(
      companyId,
      user.id,
    );
    return {
      message: 'Minhas visitas programadas encontradas',
      data,
      metadata,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Patch('scheduled-visits/:id')
  async updateScheduledVisit(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduledVisitDto,
  ) {
    const visit = await this.scheduledVisitService.update(companyId, id, dto);
    return { message: 'Visita programada atualizada', data: visit };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Delete('scheduled-visits/:id')
  async cancelScheduledVisit(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.scheduledVisitService.cancel(companyId, id);
    return { message: 'Visita programada cancelada' };
  }

  /* ─── visit history ─── */

  @Get('visit-records/history')
  async findVisitHistory(@Param('companyId', ParseIntPipe) companyId: number) {
    const { data, metadata } = await this.tripService.findAllVisitRecords(
      companyId,
    );
    return { message: 'Histórico de visitas encontrado', data, metadata };
  }
}
