export enum UserRole {
  Administrator = 'ADMINISTRATOR',
  Ceo = 'CEO',
  CompanyAdministrator = 'COMPANY_ADMINISTRATOR',
  DirectorOfSales = 'DIRECTOR_OF_SALES',
  NationalManager = 'NATIONAL_MANAGER',
  RegionalManager = 'REGIONAL_MANAGER',
  SalesCoordinator = 'SALES_COORDINATOR',
  SalesRep = 'SALES_REP',
  CustomerClient = 'CUSTOMER_CLIENT',
}

export const UserRoleHierarchy: Record<UserRole, number> = {
  [UserRole.Ceo]: 99,
  [UserRole.Administrator]: 80,
  [UserRole.CompanyAdministrator]: 70,
  [UserRole.DirectorOfSales]: 60,
  [UserRole.NationalManager]: 50,
  [UserRole.RegionalManager]: 40,
  [UserRole.SalesCoordinator]: 30,
  [UserRole.SalesRep]: 20,
  [UserRole.CustomerClient]: 1,
};

export const roleHierarchy = {
  [UserRole.Ceo]: [
    UserRole.CompanyAdministrator,
    UserRole.DirectorOfSales,
    UserRole.NationalManager,
    UserRole.RegionalManager,
    UserRole.SalesCoordinator,
    UserRole.SalesRep,
    UserRole.CustomerClient,
  ],
  [UserRole.DirectorOfSales]: [
    UserRole.NationalManager,
    UserRole.RegionalManager,
    UserRole.SalesCoordinator,
    UserRole.SalesRep,
  ],
  [UserRole.NationalManager]: [
    UserRole.RegionalManager,
    UserRole.SalesCoordinator,
    UserRole.SalesRep,
  ],
  [UserRole.RegionalManager]: [UserRole.SalesCoordinator, UserRole.SalesRep],
  [UserRole.SalesCoordinator]: [UserRole.SalesRep],
  [UserRole.SalesRep]: [],
  [UserRole.Administrator]: [],
  [UserRole.CompanyAdministrator]: [],
  [UserRole.CustomerClient]: [],
};

export function getRolesAccessibleByRole(
  role: UserRole,
  rolesToExclude: UserRole[] = [],
): UserRole[] {
  const roleLevel = UserRoleHierarchy[role];
  if (roleLevel === undefined) {
    return [];
  }

  const accessibleRoles: UserRole[] = [];
  for (const userRole in UserRoleHierarchy) {
    if (
      UserRoleHierarchy[userRole as UserRole] >= roleLevel &&
      !rolesToExclude.includes(userRole as UserRole)
    ) {
      accessibleRoles.push(userRole as UserRole);
    }
  }
  return accessibleRoles;
}
