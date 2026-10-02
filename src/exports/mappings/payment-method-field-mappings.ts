import { FieldDefinition } from '../interfaces/field-definition.interface';

export const paymentMethodFieldMappings: FieldDefinition[] = [
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
    field: 'orders.length',
    label: 'Qtd. Pedidos',
    transform: (value) => value?.toString() || '0',
  },
  {
    field: 'customers.length',
    label: 'Qtd. Clientes',
    transform: (value) => value?.toString() || '0',
  },
];
