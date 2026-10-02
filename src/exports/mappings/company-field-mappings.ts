import { CompanyStatus } from '../../companies/enums/company-status.enum';
import { FieldDefinition } from '../interfaces/field-definition.interface';

export const companyFieldMappings: FieldDefinition[] = [
  {
    field: 'id',
    label: 'Identificador',
    transform: (value) => value.toString().padStart(5, '0'),
  },
  { field: 'corporateName', label: 'Razão Social' },
  { field: 'fantasyName', label: 'Nome Fantasia' },
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
        [CompanyStatus.Active]: 'Ativa',
        [CompanyStatus.Inactive]: 'Inativa',
      };
      return statusMap[value] || value;
    },
  },
  {
    field: 'logoUrl',
    label: 'Logo',
  },
  {
    field: 'customColor',
    label: 'Cor Personalizada',
  },
  {
    field: 'createdAt',
    label: 'Data de Criação',
    transform: (value) => new Date(value).toLocaleDateString('pt-BR'),
  },
  {
    field: 'updatedAt',
    label: 'Última Atualização',
    transform: (value) => new Date(value).toLocaleDateString('pt-BR'),
  },
  {
    field: 'users.length',
    label: 'Quantidade de Usuários',
    transform: (value) => value?.toString() || '0',
  },
  {
    field: 'customers.length',
    label: 'Quantidade de Clientes',
    transform: (value) => value?.toString() || '0',
  },
  {
    field: 'products.length',
    label: 'Quantidade de Produtos',
    transform: (value) => value?.toString() || '0',
  },
];
