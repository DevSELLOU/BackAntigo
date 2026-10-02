export interface OrdersReportDto {
  orderId: number;
  orderStatus: string;
  totalValue: number;
  createdAt: string;
  customerName: string;
  customerDocument: string;
  customerSegment: string;
  customerUF: string;
  customerGroup: string;
  paymentCondition: string;
  amountPaid: number;
  discount: number;
  itemsCount: number;
  itemsTotalValue: number;
}
