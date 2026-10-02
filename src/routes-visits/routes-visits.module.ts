import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CompaniesModule } from 'src/companies/companies.module';
import { UsersModule } from 'src/users/users.module';
import { CustomersModule } from 'src/presentation/customers/customers.module';
import { RoutesVisitsController } from './routes-visits.controller';
import { RouteService } from './route.service';
import { TripService } from './trip.service';
import { ScheduledVisitService } from './scheduled-visit.service';
import { VisitRecordService } from './visit-record.service';
import { routesVisitsProviders } from './routes-visits.providers';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    CompaniesModule,
    UsersModule,
    CustomersModule,
  ],
  providers: [
    RouteService,
    TripService,
    ScheduledVisitService,
    VisitRecordService,
    ...routesVisitsProviders,
  ],
  controllers: [RoutesVisitsController],
  exports: [
    RouteService,
    TripService,
    ScheduledVisitService,
    VisitRecordService,
  ],
})
export class RoutesVisitsModule {}
