import { Roles } from './roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

export const REPORT_VIEWER_ROLES: UserRole[] = [
  UserRole.Administrator,
  UserRole.CompanyAdministrator,
  UserRole.CustomerClient,
  UserRole.Ceo,
  UserRole.DirectorOfSales,
  UserRole.NationalManager,
  UserRole.RegionalManager,
  UserRole.SalesCoordinator,
  UserRole.SalesRep,
];

export const ReportViewer = () => Roles(...REPORT_VIEWER_ROLES);
