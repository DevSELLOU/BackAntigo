import { UserHierarchy } from './user-hierarchy.entity';

export const UserHierarchiesProviders = [
  {
    provide: 'USER_HIERARCHY_REPOSITORY',
    useValue: UserHierarchy,
  },
];
