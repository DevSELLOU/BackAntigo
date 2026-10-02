import { UserStatus } from '../../users/enums/user-status.enum';
import { FieldDefinition } from '../interfaces/field-definition.interface';

export const customerClientFieldMappings: FieldDefinition[] = [
  {
    field: 'id',
    label: 'Identificador',
    transform: (value) => value.toString().padStart(5, '0'),
  },
  { field: 'name', label: 'Nome Completo' },
  { field: 'email', label: 'E-mail' },
  { field: 'phoneNumber', label: 'Telefone' },
  { field: 'position', label: 'Cargo' },
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
    field: 'createdAt',
    label: 'Data de Cadastro',
    transform: (value) => new Date(value).toLocaleDateString('pt-BR'),
  },
  {
    field: 'updatedAt',
    label: 'Última Atualização',
    transform: (value) => new Date(value).toLocaleDateString('pt-BR'),
  },
  {
    field: 'orders.length',
    label: 'Qtd. Pedidos',
    transform: (value) => value?.toString() || '0',
  },
  {
    field: 'company.fantasyName',
    label: 'Empresa',
  },
  {
    field: 'customer.fantasyName',
    label: 'Cliente',
  },
];
