import { UserRole } from '../../users/enums/user-role.enum';
import { UserStatus } from '../../users/enums/user-status.enum';
import { FieldDefinition } from '../interfaces/field-definition.interface';

export const userFieldMappings: FieldDefinition[] = [
  {
    field: 'id',
    label: 'Identificador',
    transform: (value) => value.toString().padStart(5, '0'),
  },
  { field: 'name', label: 'Nome Completo' },
  { field: 'email', label: 'E-mail' },
  { field: 'phoneNumber', label: 'Telefone' },
  {
    field: 'role',
    label: 'Função',
    transform: (value) => {
      const roles = {
        [UserRole.Administrator]: 'Administrador',
        [UserRole.CompanyAdministrator]: 'Administrador de Empresa',
        [UserRole.CustomerClient]: 'Cliente Final',
      };
      return roles[value] || value;
    },
  },
  {
    field: 'position',
    label: 'Cargo',
    transform: (value) => value || 'Não informado',
  },
  {
    field: 'profilePhoto',
    label: 'Foto de Perfil',
  },
  {
    field: 'createdAt',
    label: 'Data de Criação',
    transform: (value) => new Date(value).toLocaleDateString('pt-BR'),
  },
  {
    field: 'status',
    label: 'Status',
    transform: (value) => {
      const status = {
        [UserStatus.Onboarding]: 'Em Onboarding',
        [UserStatus.Active]: 'Ativo',
        [UserStatus.Inactive]: 'Inativo',
      };
      return status[value] || value;
    },
  },
  {
    field: 'company.fantasyName',
    label: 'Empresa',
    transform: (value) => value || 'Não associado',
  },
  {
    field: 'customer.fantasyName',
    label: 'Cliente',
    transform: (value) => value || 'N/A',
  },
];
