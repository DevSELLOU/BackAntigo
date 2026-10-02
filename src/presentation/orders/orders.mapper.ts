import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { Company } from 'src/companies/company.entity';
import { User } from 'src/users/user.entity';
import { formatCnpj } from 'src/utils/format-cnpj.util';
import { formatCurrency } from 'src/utils/format-currency.util';
import { formatDateTime } from 'src/utils/format-date-time.util';
import { formatPhone } from 'src/utils/format-phone.util';
import { Customer } from '../customers/customer.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderAmountPaidDto } from './dtos/update-order-amount-paid.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { OrderStatus } from './enums/order-status.enum';
import { Order } from './order.entity';

@Injectable()
export class OrdersMapper {
  constructor() {}

  async createOrderDtoToOrder(
    createOrderDto: CreateOrderDto,
    responsibleUserId: number,
    isCustomerClient: boolean,
  ): Promise<Order> {
    const order = new Order();
    Object.assign(order, createOrderDto);
    order.responsibleUserId = responsibleUserId;

    if (isCustomerClient) {
      order.status = OrderStatus.InApproval;
      order.isCustomerClientOrder = true;
    } else if (createOrderDto.isBudget) {
      order.status = OrderStatus.OnBudget;
    } else {
      order.status = OrderStatus.InApproval;
    }

    return order;
  }

  async updateOrderDtoToOrder(
    currentOrder: Order,
    updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    Object.entries(updateOrderDto).forEach(([key, value]) => {
      if (value !== undefined) {
        (currentOrder as any)[key] = value;
      }
    });

    return currentOrder;
  }

  async updateAmountPaidDtoToOrder(
    currentOrder: Order,
    updateOrderAmountPaidDto: UpdateOrderAmountPaidDto,
  ): Promise<Order> {
    if (updateOrderAmountPaidDto.amountPaid !== undefined)
      currentOrder.amountPaid = updateOrderAmountPaidDto.amountPaid;
    return currentOrder;
  }

  async generateOrderHtml(
    order: Order,
    customer: Customer,
    user: User,
    company: Company,
  ): Promise<string> {
    const title = `Pedido #${order.id}`;
    const companyLogo = company?.logoUrl;
    const companyColor =
      company?.customColor || company?.shopColor || '#2c3e50';
    const companyColorLight = companyColor + '15';
    const companyColorDark = adjustColorBrightness(companyColor, -20);
    const orderItems = order.orderItems;

    const itemDiscounts = orderItems.reduce((sum, item) => {
      return sum + parseFloat(item.discount?.toString() || '0');
    }, 0);

    const orderDiscount = parseFloat(order.discount?.toString() || '0');
    const totalDiscount = itemDiscounts + orderDiscount;

    const hasAnyReference = orderItems.some((item) => item.product.reference);
    const hasAnySupplierCode = orderItems.some(
      (item) => item.product.supplierCode,
    );
    const hasAnyBarcode = orderItems.some((item) => item.product.barcode);

    const productHeaders = ['<th>Produto</th>'];
    if (hasAnyReference) productHeaders.push('<th>Referência</th>');
    if (hasAnySupplierCode) productHeaders.push('<th>Cód. Fornecedor</th>');
    if (hasAnyBarcode) productHeaders.push('<th>Cód. Barras</th>');
    productHeaders.push(
      '<th>Quantidade</th>',
      '<th>Preço</th>',
      '<th>Desconto</th>',
      '<th>Foto</th>',
    );

    return `
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 20px; color: #1a1a1a; background-color: #fafafa; font-size: 10px; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; background: linear-gradient(135deg, ${companyColor} 0%, ${companyColorDark} 100%); padding: 15px 20px; border-radius: 8px; }
            .company-logo { max-width: 140px; max-height: 70px; border-radius: 4px; }
            .order-title-box { text-align: right; color: #fff; }
            .order-title-box h1 { margin: 0; font-size: 22px; font-weight: 600; color: #fff; letter-spacing: 0.5px; }
            .order-title-box .date { font-size: 11px; opacity: 0.85; margin-top: 4px; }
            .section { background: #fff; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
            .section-title { background: ${companyColorLight}; padding: 8px 15px; font-weight: 600; font-size: 9px; color: ${companyColor}; letter-spacing: 0.8px; border-bottom: 1px solid ${companyColorLight}; }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; padding: 12px 15px; }
            .info-grid.row { display: flex; flex-wrap: wrap; gap: 12px; }
            .info-item { display: flex; flex-direction: column; }
            .info-item.full-width { width: 100%; }
            .field-label { font-size: 8px; color: #7f8c8d; text-transform: uppercase; margin-bottom: 3px; font-weight: 500; letter-spacing: 0.5px; }
            .field-value { font-size: 11px; color: #2c3e50; font-weight: 600; }
            table.items-table { width: 100%; border-collapse: collapse; margin-top: 10px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
            table.items-table th { background: ${companyColor}; font-size: 8px; padding: 10px 8px; color: #fff; text-align: left; font-weight: 600; letter-spacing: 0.5px; }
            table.items-table td { font-size: 9px; padding: 10px 8px; border-bottom: 1px solid #ecf0f1; color: #2c3e50; }
            table.items-table tr:last-child td { border-bottom: none; }
            .product-photo { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #ecf0f1; }
            .summary-row { display: flex; justify-content: flex-end; gap: 20px; padding: 12px 15px; background: #f8f9fa; border-top: 1px solid #ecf0f1; }
            .summary-item { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              ${
                companyLogo
                  ? `<img src="${companyLogo}" class="company-logo" />`
                  : ''
              }
            </div>
            <div class="order-title-box">
              <h1>${title}</h1>
              <div class="date">Emitido em: ${formatDateTime(
                order.createdAt,
              )}</div>
            </div>
          </div>
  
          <div class="section">
            <div class="section-title">Cliente</div>
            <div class="info-grid row">
              <div class="info-item" style="flex: 3;">
                <span class="field-label">Nome / Razão Social</span>
                <span class="field-value">${customer.corporateName}</span>
              </div>
              <div class="info-item">
                <span class="field-label">CPF / CNPJ</span>
                <span class="field-value">${formatCnpj(
                  customer.document,
                )}</span>
              </div>
            </div>
            <div class="info-grid row">
              <div class="info-item" style="flex: 2;">
                <span class="field-label">Cidade</span>
                <span class="field-value">${customer.city} - ${
                  customer.UF
                }</span>
              </div>
              <div class="info-item">
                <span class="field-label">Telefone</span>
                <span class="field-value">${formatPhone(
                  customer.phoneNumber,
                )}</span>
              </div>
              <div class="info-item">
                <span class="field-label">Tel. Empresa</span>
                <span class="field-value">${formatPhone(
                  customer.companyPhone,
                )}</span>
              </div>
            </div>
          </div>
  
          <div class="section">
            <div class="section-title">Responsável</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="field-label">Vendedor</span>
                <span class="field-value">${user.name}</span>
              </div>
            </div>
          </div>
  
          <div class="section">
            <div class="section-title">Dados do Pedido</div>
            <div class="info-grid row">
              <div class="info-item">
                <span class="field-label">Status</span>
                <span class="field-value">${formatOrderStatus(
                  order.status,
                )}</span>
              </div>
              <div class="info-item">
                <span class="field-label">Ordem de Compra</span>
                <span class="field-value">${
                  order.purchaseOrderNumber || '-'
                }</span>
              </div>
              <div class="info-item">
                <span class="field-label">Condição de Pagamento</span>
                <span class="field-value">${
                  order.paymentCondition?.name || '-'
                }</span>
              </div>
              <div class="info-item">
                <span class="field-label">Forma de Pagamento</span>
                <span class="field-value">${
                  order.paymentMethod?.name || '-'
                }</span>
              </div>
              <div class="info-item">
                <span class="field-label">Total</span>
                <span class="field-value">${formatCurrency(
                  order.totalValue,
                )}</span>
              </div>
              <div class="info-item">
                <span class="field-label">Pago</span>
                <span class="field-value">${formatCurrency(
                  order.amountPaid,
                )}</span>
              </div>
            </div>
            <div class="summary-row">
              <div class="summary-item">
                <span class="field-label">Desconto</span>
                <span class="field-value">${formatCurrency(
                  totalDiscount,
                )}</span>
              </div>
            </div>
            ${
              order.observation
                ? `
            <div class="info-grid">
              <div class="info-item full-width">
                <span class="field-label">Observações</span>
                <span class="field-value">${order.observation}</span>
              </div>
            </div>
            `
                : ''
            }
          </div>
  
          <div>
            <table class="items-table">
              <tr>
                ${productHeaders.join('')}
              </tr>
              ${orderItems
                .map((item) => {
                  const productCells = ['<td>' + item.product.name + '</td>'];
                  if (hasAnyReference)
                    productCells.push(
                      '<td>' + (item.product.reference || '') + '</td>',
                    );
                  if (hasAnySupplierCode)
                    productCells.push(
                      '<td>' + (item.product.supplierCode || '') + '</td>',
                    );
                  if (hasAnyBarcode)
                    productCells.push(
                      '<td>' + (item.product.barcode || '') + '</td>',
                    );
                  productCells.push(
                    '<td>' + item.quantity + '</td>',
                    '<td>' + formatCurrency(item.product.price) + '</td>',
                    '<td>' + formatCurrency(item.discount || 0) + '</td>',
                    item.product.photos[0]?.url
                      ? '<td><img src="' +
                          item.product.photos[0]?.url +
                          '" class="product-photo" /></td>'
                      : '<td></td>',
                  );
                  return '<tr>' + productCells.join('') + '</tr>';
                })
                .join('')}
            </table>
          </div>
        </body>
      </html>
    `;
  }

  async convertHtmlToPdf(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      executablePath:
        process.env.NODE_ENV === 'development'
          ? undefined
          : '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);

    await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  async exportOrderToPdf(
    order: Order,
    customer: Customer,
    user: User,
    company: Company,
  ): Promise<Buffer> {
    const title = `Pedido #${order.id}`;
    const companyLogo = company?.logoUrl;
    const companyColor =
      company?.customColor || company?.shopColor || '#2c3e50';
    const companyColorLight = companyColor + '15';
    const companyColorDark = adjustColorBrightness(companyColor, -20);
    const orderItems = order.orderItems;

    const itemDiscounts = orderItems.reduce((sum, item) => {
      return sum + parseFloat(item.discount?.toString() || '0');
    }, 0);

    const orderDiscount = parseFloat(order.discount?.toString() || '0');
    const totalDiscount = itemDiscounts + orderDiscount;

    const hasAnyReference = orderItems.some((item) => item.product.reference);
    const hasAnySupplierCode = orderItems.some(
      (item) => item.product.supplierCode,
    );
    const hasAnyBarcode = orderItems.some((item) => item.product.barcode);

    const productHeaders = ['<th>Produto</th>'];
    if (hasAnyReference) productHeaders.push('<th>Referência</th>');
    if (hasAnySupplierCode) productHeaders.push('<th>Cód. Fornecedor</th>');
    if (hasAnyBarcode) productHeaders.push('<th>Cód. Barras</th>');
    productHeaders.push(
      '<th>Quantidade</th>',
      '<th>Preço</th>',
      '<th>Desconto</th>',
      '<th>Foto</th>',
    );

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 20px; color: #1a1a1a; background-color: #fafafa; font-size: 10px; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; background: linear-gradient(135deg, ${companyColor} 0%, ${companyColorDark} 100%); padding: 15px 20px; border-radius: 8px; }
            .company-logo { max-width: 140px; max-height: 70px; border-radius: 4px; }
            .order-title-box { text-align: right; color: #fff; }
            .order-title-box h1 { margin: 0; font-size: 22px; font-weight: 600; color: #fff; letter-spacing: 0.5px; }
            .order-title-box .date { font-size: 11px; opacity: 0.85; margin-top: 4px; }
            .section { background: #fff; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
            .section-title { background: ${companyColorLight}; padding: 8px 15px; font-weight: 600; font-size: 9px; color: ${companyColor}; letter-spacing: 0.8px; border-bottom: 1px solid ${companyColorLight}; }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; padding: 12px 15px; }
            .info-grid.row { display: flex; flex-wrap: wrap; gap: 12px; }
            .info-item { display: flex; flex-direction: column; }
            .info-item.full-width { width: 100%; }
            .field-label { font-size: 8px; color: #7f8c8d; text-transform: uppercase; margin-bottom: 3px; font-weight: 500; letter-spacing: 0.5px; }
            .field-value { font-size: 11px; color: #2c3e50; font-weight: 600; }
            table.items-table { width: 100%; border-collapse: collapse; margin-top: 10px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
            table.items-table th { background: ${companyColor}; font-size: 8px; padding: 10px 8px; color: #fff; text-align: left; font-weight: 600; letter-spacing: 0.5px; }
            table.items-table td { font-size: 9px; padding: 10px 8px; border-bottom: 1px solid #ecf0f1; color: #2c3e50; }
            table.items-table tr:last-child td { border-bottom: none; }
            .product-photo { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #ecf0f1; }
            .summary-row { display: flex; justify-content: flex-end; gap: 20px; padding: 12px 15px; background: #f8f9fa; border-top: 1px solid #ecf0f1; }
            .summary-item { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              ${
                companyLogo
                  ? `<img src="${companyLogo}" class="company-logo" />`
                  : ''
              }
            </div>
            <div class="order-title-box">
              <h1>${title}</h1>
              <div class="date">Emitido em: ${formatDateTime(
                order.createdAt,
              )}</div>
            </div>
          </div>
  
          <div class="section">
            <div class="section-title">Cliente</div>
            <div class="info-grid row">
              <div class="info-item" style="flex: 3;">
                <span class="field-label">Nome / Razão Social</span>
                <span class="field-value">${customer.corporateName}</span>
              </div>
              <div class="info-item">
                <span class="field-label">CPF / CNPJ</span>
                <span class="field-value">${formatCnpj(
                  customer.document,
                )}</span>
              </div>
            </div>
            <div class="info-grid row">
              <div class="info-item" style="flex: 2;">
                <span class="field-label">Cidade</span>
                <span class="field-value">${customer.city} - ${
                  customer.UF
                }</span>
              </div>
              <div class="info-item">
                <span class="field-label">Telefone</span>
                <span class="field-value">${formatPhone(
                  customer.phoneNumber,
                )}</span>
              </div>
              <div class="info-item">
                <span class="field-label">Tel. Empresa</span>
                <span class="field-value">${formatPhone(
                  customer.companyPhone,
                )}</span>
              </div>
            </div>
          </div>
  
          <div class="section">
            <div class="section-title">Responsável</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="field-label">Vendedor</span>
                <span class="field-value">${user.name}</span>
              </div>
            </div>
          </div>
  
          <div class="section">
            <div class="section-title">Dados do Pedido</div>
            <div class="info-grid row">
              <div class="info-item">
                <span class="field-label">Status</span>
                <span class="field-value">${formatOrderStatus(
                  order.status,
                )}</span>
              </div>
              <div class="info-item">
                <span class="field-label">Ordem de Compra</span>
                <span class="field-value">${
                  order.purchaseOrderNumber || '-'
                }</span>
              </div>
              <div class="info-item">
                <span class="field-label">Condição de Pagamento</span>
                <span class="field-value">${
                  order.paymentCondition?.name || '-'
                }</span>
              </div>
              <div class="info-item">
                <span class="field-label">Forma de Pagamento</span>
                <span class="field-value">${
                  order.paymentMethod?.name || '-'
                }</span>
              </div>
              <div class="info-item">
                <span class="field-label">Total</span>
                <span class="field-value">${formatCurrency(
                  order.totalValue,
                )}</span>
              </div>
              <div class="info-item">
                <span class="field-label">Pago</span>
                <span class="field-value">${formatCurrency(
                  order.amountPaid,
                )}</span>
              </div>
            </div>
            <div class="summary-row">
              <div class="summary-item">
                <span class="field-label">Desconto</span>
                <span class="field-value">${formatCurrency(
                  totalDiscount,
                )}</span>
              </div>
            </div>
            ${
              order.observation
                ? `
            <div class="info-grid">
              <div class="info-item full-width">
                <span class="field-label">Observações</span>
                <span class="field-value">${order.observation}</span>
              </div>
            </div>
            `
                : ''
            }
          </div>
  
          <div>
            <table class="items-table">
              <tr>
                ${productHeaders.join('')}
              </tr>
              ${orderItems
                .map((item) => {
                  const productCells = ['<td>' + item.product.name + '</td>'];
                  if (hasAnyReference)
                    productCells.push(
                      '<td>' + (item.product.reference || '') + '</td>',
                    );
                  if (hasAnySupplierCode)
                    productCells.push(
                      '<td>' + (item.product.supplierCode || '') + '</td>',
                    );
                  if (hasAnyBarcode)
                    productCells.push(
                      '<td>' + (item.product.barcode || '') + '</td>',
                    );
                  productCells.push(
                    '<td>' + item.quantity + '</td>',
                    '<td>' + formatCurrency(item.product.price) + '</td>',
                    '<td>' + formatCurrency(item.discount || 0) + '</td>',
                    item.product.photos[0]?.url
                      ? '<td><img src="' +
                          item.product.photos[0]?.url +
                          '" class="product-photo" /></td>'
                      : '<td></td>',
                  );
                  return '<tr>' + productCells.join('') + '</tr>';
                })
                .join('')}
            </table>
          </div>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      executablePath:
        process.env.NODE_ENV === 'development'
          ? undefined
          : '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);

    await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return Buffer.from(pdfBuffer);
  }
}

function formatOrderStatus(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    [OrderStatus.OnBudget]: 'Orçamento',
    [OrderStatus.InApproval]: 'Em Aprovação',
    [OrderStatus.Approved]: 'Aprovado',
    [OrderStatus.Invoiced]: 'Faturado',
    [OrderStatus.Dispatched]: 'Enviado',
    [OrderStatus.Delivered]: 'Entregue',
    [OrderStatus.Returned]: 'Devolvido',
    [OrderStatus.Canceled]: 'Cancelado',
    [OrderStatus.Blocked]: 'Bloqueado',
  };
  return statusMap[status] || status;
}

function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}
