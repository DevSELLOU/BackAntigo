import { UserRole } from 'src/users/enums/user-role.enum';

export function getUserRoleText(role: UserRole): string {
  return {
    [UserRole.Administrator]: 'Administrador',
    [UserRole.CompanyAdministrator]: 'Administrador',
    [UserRole.CustomerClient]: 'Cliente',
    [UserRole.Ceo]: 'CEO',
    [UserRole.DirectorOfSales]: 'Diretor de Vendas',
    [UserRole.NationalManager]: 'Gerente Nacional',
    [UserRole.RegionalManager]: 'Gerente Regional',
    [UserRole.SalesCoordinator]: 'Coordenador de Vendas',
    [UserRole.SalesRep]: 'Representante de Vendas',
  }[role];
}
