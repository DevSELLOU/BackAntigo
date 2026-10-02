import { FieldDefinition } from '../interfaces/field-definition.interface';

export const segmentFieldMappings: FieldDefinition[] = [
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
    field: 'subSegments.length',
    label: 'Qtd. Subsegmentos',
    transform: (value) => value?.toString() || '0',
  },
];
