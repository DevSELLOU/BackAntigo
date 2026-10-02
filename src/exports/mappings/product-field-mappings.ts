import { FieldDefinition } from '../interfaces/field-definition.interface';

export const productFieldMappings: FieldDefinition[] = [
  {
    field: 'id',
    label: 'Identificador',
    transform: (value) => value.toString().padStart(5, '0'),
  },
  { field: 'name', label: 'Nome do Produto' },
  {
    field: 'description',
    label: 'Descrição',
    transform: (value) => value || 'Sem descrição',
  },
  {
    field: 'price',
    label: 'Preço',
    transform: (value) => `R$ ${Number(value).toFixed(2)}`,
  },
  { field: 'ncm', label: 'NCM' },
  { field: 'colors', label: 'Cores' },
  { field: 'brand', label: 'Marca' },
  { field: 'unitOfMeasure', label: 'Unidade de Medida' },
  {
    field: 'height',
    label: 'Altura',
    transform: (value) => (value ? `${value}` : ''),
  },
  {
    field: 'length',
    label: 'Comprimento',
    transform: (value) => (value ? `${value}` : ''),
  },
  {
    field: 'width',
    label: 'Largura',
    transform: (value) => (value ? `${value}` : ''),
  },
  {
    field: 'thickness',
    label: 'Espessura',
    transform: (value) => (value ? `${value}` : ''),
  },
  {
    field: 'netWeight',
    label: 'Peso Líquido',
    transform: (value) => (value ? `${value} kg` : ''),
  },
  { field: 'reference', label: 'Referência' },
  { field: 'model', label: 'Modelo' },
  { field: 'stock', label: 'Estoque' },
  {
    field: 'ipi',
    label: 'IPI (%)',
    transform: (value) => (value ? `${value}%` : ''),
  },
  {
    field: 'st',
    label: 'ST (%)',
    transform: (value) => (value ? `${value}%` : ''),
  },
  {
    field: 'icms',
    label: 'ICMS (%)',
    transform: (value) => (value ? `${value}%` : ''),
  },
  { field: 'barcode', label: 'Código de Barras' },
  { field: 'manufacturer', label: 'Fabricante' },
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
    field: 'photos.length',
    label: 'Qtd. Fotos',
    transform: (value) => value?.toString() || '0',
  },
  {
    field: 'subCategories.length',
    label: 'Qtd. Subcategorias',
    transform: (value) => value?.toString() || '0',
  },
];
