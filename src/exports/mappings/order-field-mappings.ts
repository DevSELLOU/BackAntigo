import { OrderStatus } from '../../presentation/orders/enums/order-status.enum';
import { FieldDefinition } from '../interfaces/field-definition.interface';

export const orderFieldMappings: FieldDefinition[] = [
  {
    field: 'id',
    label: 'Nº do Pedido',
    transform: (value) => value.toString().padStart(6, '0'),
  },
  {
    field: 'status',
    label: 'Status',
    transform: (value) => {
      const statuses = {
        [OrderStatus.OnBudget]: 'Orçamento',
        [OrderStatus.InApproval]: 'Em Aprovação',
        [OrderStatus.Approved]: 'Aprovado',
        [OrderStatus.Invoiced]: 'Faturado',
        [OrderStatus.Dispatched]: 'Despachado',
        [OrderStatus.Delivered]: 'Entregue',
        [OrderStatus.Returned]: 'Devolvido',
      };
      return statuses[value] || value;
    },
  },
  {
    field: 'purchaseOrderNumber',
    label: 'Nº da Ordem de Compra',
    transform: (value) => value || 'N/A',
  },
  {
    field: 'totalValue',
    label: 'Valor Total',
    transform: (value) => `R$ ${Number(value).toFixed(2)}`,
  },
  {
    field: 'discount',
    label: 'Desconto',
    transform: (value) => `R$ ${Number(value).toFixed(2)}`,
  },
  {
    field: 'amountPaid',
    label: 'Valor Pago',
    transform: (value) => `R$ ${Number(value).toFixed(2)}`,
  },
  {
    field: 'createdAt',
    label: 'Data do Pedido',
    transform: (value) => new Date(value).toLocaleDateString('pt-BR'),
  },
  {
    field: 'updatedAt',
    label: 'Última Atualização',
    transform: (value) => new Date(value).toLocaleDateString('pt-BR'),
  },
  {
    field: 'observation',
    label: 'Observação',
    transform: (value) => value || '',
  },
  {
    field: 'returnReason',
    label: 'Motivo de Devolução',
    transform: (value) => value || 'N/A',
  },
  {
    field: 'isCustomerClientOrder',
    label: 'Pedido de Cliente Final',
    transform: (value) => (value ? 'Sim' : 'Não'),
  },
  {
    field: 'customer.fantasyName',
    label: 'Cliente',
  },
  {
    field: 'customer.document',
    label: 'CPF/CNPJ do Cliente',
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
  {
    field: 'responsibleUser.name',
    label: 'Responsável',
  },
  {
    field: 'paymentMethod.name',
    label: 'Método de Pagamento',
  },
  {
    field: 'paymentCondition.name',
    label: 'Condição de Pagamento',
  },
  {
    field: 'orderItems.length',
    label: 'Quantidade de Itens',
    transform: (value) => value?.toString() || '0',
  },
];
