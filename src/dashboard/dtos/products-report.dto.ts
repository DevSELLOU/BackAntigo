export interface ProductsReportDto {
  productId: number;
  productName: string;
  brand?: string;
  totalQuantitySold: number;
  totalRevenue: number;
  currentStock: number;
  periodStart: string | null; // ISO date (YYYY-MM-DD) or null when no period
  periodEnd: string | null;
}

export interface ProductCustomerDto {
  customerId: number;
  customerName: string;
  customerDocument: string;
  totalQuantity: number;
  totalSpent: number;
  lastPurchaseDate: string | null;
}
