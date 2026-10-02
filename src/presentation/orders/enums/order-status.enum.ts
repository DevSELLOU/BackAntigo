export enum OrderStatus {
  OnBudget = 'ON_BUDGET',
  InApproval = 'IN_APPROVAL',
  Approved = 'APPROVED',
  Invoiced = 'INVOICED',
  Dispatched = 'DISPATCHED',
  Delivered = 'DELIVERED',
  Returned = 'RETURNED',
  Canceled = 'CANCELED',
  Blocked = 'BLOCKED',
}

export const ACTIVE_ORDER_STATUSES = [
  OrderStatus.Delivered,
  OrderStatus.Dispatched,
  OrderStatus.Invoiced,
];

export const INVOICED_ORDER_STATUSES = [
  OrderStatus.Delivered,
  OrderStatus.Dispatched,
  OrderStatus.Invoiced,
];
