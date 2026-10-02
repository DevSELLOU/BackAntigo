import { AccessRequest } from './access-request.entity';

export const AccessRequestsProviders = [
  {
    provide: 'ACCESS_REQUEST_REPOSITORY',
    useValue: AccessRequest,
  },
];
