import { Provider } from '@nestjs/common';
import { Route } from './entities/route.entity';
import { Trip } from './entities/trip.entity';
import { VisitRecord } from './entities/visit-record.entity';
import { ScheduledVisit } from './entities/scheduled-visit.entity';

export const routesVisitsProviders: Provider[] = [
  {
    provide: 'ROUTE_REPOSITORY',
    useValue: Route,
  },
  {
    provide: 'TRIP_REPOSITORY',
    useValue: Trip,
  },
  {
    provide: 'VISIT_RECORD_REPOSITORY',
    useValue: VisitRecord,
  },
  {
    provide: 'SCHEDULED_VISIT_REPOSITORY',
    useValue: ScheduledVisit,
  },
];
