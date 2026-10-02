import { CustomerTaxRegime } from '../../presentation/customers/enums/customer-tax-regime.enum';
import { FieldDefinition } from '../interfaces/field-definition.interface';

export const customerFieldMappings: FieldDefinition[] = [
  {
    field: 'id',
    label: 'Identificador',
    transform: (value) => value.toString().padStart(5, '0'),
  },
  { field: 'corporateName', label: 'Razão Social' },
  { field: 'fantasyName', label: 'Nome Fantasia' },
  {
    field: 'document',
    label: 'CPF/CNPJ',
    transform: (value) => {
      if (value.length === 11) {
        return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(
          6,
          9,
        )}-${value.slice(9)}`;
      } else if (value.length === 14) {
        return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(
          5,
          8,
        )}/${value.slice(8, 12)}-${value.slice(12)}`;
      }
      return value;
    },
  },
  { field: 'creditLimit', label: 'Limite de Crédito' },
  { field: 'creditLimitUsed', label: 'Crédito Utilizado' },
  { field: 'stateRegistration', label: 'Inscrição Estadual' },
  { field: 'gln', label: 'GLN' },
  { field: 'address', label: 'Endereço' },
  { field: 'city', label: 'Cidade' },
  { field: 'UF', label: 'UF' },
  { field: 'neighborhood', label: 'Bairro' },
  { field: 'cep', label: 'CEP' },
  { field: 'phoneNumber', label: 'Telefone' },
  { field: 'companyPhone', label: 'Telefone da Empresa' },
  { field: 'email', label: 'E-mail' },
  { field: 'url', label: 'Website' },
  { field: 'youtubeUrl', label: 'Vídeo do YouTube' },
  { field: 'segment', label: 'Segmento' },
  {
    field: 'taxRegime',
    label: 'Regime Tributário',
    transform: (value) => {
      const regimes = {
        [CustomerTaxRegime.SimplesNacional]: 'Simples Nacional',
        [CustomerTaxRegime.LucroReal]: 'Lucro Real',
        [CustomerTaxRegime.LucroPresumido]: 'Lucro Presumido',
      };
      return regimes[value] || value;
    },
  },
  {
    field: 'taxWithholding',
    label: 'Retenção de Impostos',
    transform: (value) => (value ? 'Sim' : 'Não'),
  },
  { field: 'operationNature', label: 'Natureza da Operação' },
  { field: 'bank', label: 'Banco' },
  { field: 'agency', label: 'Agência' },
  { field: 'account', label: 'Conta' },
  { field: 'accountType', label: 'Tipo de Conta' },
  { field: 'invoiceEmail', label: 'E-mail para Nota Fiscal' },
  { field: 'orderEmail', label: 'E-mail para Pedidos' },
  { field: 'billingEmail', label: 'E-mail para Cobrança' },
  { field: 'customerGroupCode', label: 'Código do Grupo de Clientes' },
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
    field: 'subSegment.name',
    label: 'Subsegmento',
  },
  {
    field: 'orders.length',
    label: 'Qtd. Pedidos',
    transform: (value) => value?.toString() || '0',
  },
];
