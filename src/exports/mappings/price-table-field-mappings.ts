import { PriceTableStatus } from '../../presentation/price-tables/enums/price-table-status.enum';
import { FieldDefinition } from '../interfaces/field-definition.interface';

export const priceTableFieldMappings: FieldDefinition[] = [
  {
    field: 'id',
    label: 'Identificador',
    transform: (value) => value.toString().padStart(5, '0'),
  },
  { field: 'name', label: 'Nome' },
  {
    field: 'description',
    label: 'Descrição',
    transform: (value) => value || 'Sem descrição',
  },
  {
    field: 'price',
    label: 'Preço Base',
    transform: (value) => `R$ ${Number(value).toFixed(2)}`,
  },
  {
    field: 'status',
    label: 'Status',
    transform: (value) => {
      const statuses = {
        [PriceTableStatus.Active]: 'Ativa',
        [PriceTableStatus.Inactive]: 'Inativa',
      };
      return statuses[value] || value;
    },
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
    field: 'items.length',
    label: 'Qtd. Itens',
    transform: (value) => value?.toString() || '0',
  },
  {
    field: 'customer.fantasyName',
    label: 'Cliente',
  },
];
