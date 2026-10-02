import { FieldDefinition } from '../interfaces/field-definition.interface';

export const categoryFieldMappings: FieldDefinition[] = [
  {
    field: 'id',
    label: 'Identificador',
    transform: (value) => value.toString().padStart(5, '0'),
  },
  {
    field: 'name',
    label: 'Nome da Categoria',
  },
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
    field: 'subCategories.length',
    label: 'Qtd. Subcategorias',
    transform: (value) => value?.toString() || '0',
  },
  {
    field: 'company.fantasyName',
    label: 'Empresa',
  },
];
