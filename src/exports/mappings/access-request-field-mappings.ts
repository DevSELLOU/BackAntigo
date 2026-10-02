import { AccessRequestStatus } from '../../presentation/access-requests/enums/acess-request-status.enum';
import { FieldDefinition } from '../interfaces/field-definition.interface';

export const accessRequestFieldMappings: FieldDefinition[] = [
  {
    field: 'id',
    label: 'Identificador',
    transform: (value) => value.toString().padStart(5, '0'),
  },
  { field: 'fullName', label: 'Nome Completo' },
  { field: 'email', label: 'E-mail' },
  { field: 'phoneNumber', label: 'Telefone' },
  { field: 'companyName', label: 'Nome da Empresa' },
  {
    field: 'cnpj',
    label: 'CNPJ',
    transform: (value) => {
      if (value && value.length === 14) {
        return value.replace(
          /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
          '$1.$2.$3/$4-$5',
        );
      }
      return value;
    },
  },
  {
    field: 'status',
    label: 'Status',
    transform: (value) => {
      const statusMap = {
        [AccessRequestStatus.Pending]: 'Pendente',
        [AccessRequestStatus.Realized]: 'Realizada',
      };
      return statusMap[value] || value;
    },
  },
  {
    field: 'createdAt',
    label: 'Data da Solicitação',
    transform: (value) => new Date(value).toLocaleDateString('pt-BR'),
  },
  {
    field: 'company.fantasyName',
    label: 'Empresa Solicitada',
  },
  {
    field: 'customer.fantasyName',
    label: 'Cliente Associado',
    transform: (value) => value || 'N/A',
  },
];
