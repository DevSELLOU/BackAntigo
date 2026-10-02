import { UserRole } from '../../users/enums/user-role.enum';

export class AuthenticatedUserDto {
  readonly id: number;
  readonly email: string;
  readonly role: UserRole;
  readonly companyId: number;
  readonly activeCompanyId: number;
}
