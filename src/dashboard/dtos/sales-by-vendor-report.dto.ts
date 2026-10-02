export interface SalesByVendorReportDto {
  vendorId: number;
  vendorName: string;
  year: number;
  month: number;
  orderCount: number;
  totalValue: number;
  totalItems: number;
}
