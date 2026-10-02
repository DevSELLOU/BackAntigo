import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { truncateText } from 'src/utils/truncate-text.util';
import { logger } from 'src/utils/logger';

@Injectable()
export class PdfService {
  private readonly EXCLUDED_ENTITIES = ['products'];

  async generatePdf<T>(
    data: T[],
    title: string,
    entityType?: string,
  ): Promise<Buffer> {
    const useKeyValueFormat = entityType
      ? !this.EXCLUDED_ENTITIES.includes(entityType)
      : true;

    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath:
          process.env.NODE_ENV === 'development'
            ? undefined
            : '/usr/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      const htmlContent = this.generateHtmlContent(
        data,
        title,
        useKeyValueFormat,
      );

      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      });

      let pdfWidth: number;
      let pdfHeight: string;

      if (useKeyValueFormat) {
        pdfWidth = 842;
        pdfHeight = '595px';
      } else {
        const columns = Object.keys(data[0]);
        const columnWidth = 100;
        pdfWidth = Math.max(842, columns.length * columnWidth);
        pdfHeight = '595px';
      }

      const pdfBuffer = await page.pdf({
        width: `${pdfWidth}px`,
        height: pdfHeight,
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      await browser.close();

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error('Error generating PDF:', error);
      throw error;
    }
  }

  private generateHtmlContent<T>(
    data: T[],
    title: string,
    useKeyValueFormat: boolean,
  ): string {
    if (useKeyValueFormat) {
      return this.generateKeyValueHtmlContent(data, title);
    }
    return this.generateTableHtmlContent(data, title);
  }

  private generateKeyValueHtmlContent<T>(data: T[], title: string): string {
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 10px;
          }
          h1 {
            text-align: center;
            margin-bottom: 20px;
            color: #333;
          }
          .record {
            border: 1px solid #ddd;
            margin-bottom: 15px;
            page-break-inside: avoid;
            background-color: #fff;
          }
          .record-header {
            background-color: #4a5568;
            color: white;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 11px;
          }
          .record-content {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding: 12px;
          }
          .field-group {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .field-label {
            color: #666;
            font-size: 9px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .field-value {
            color: #222;
            font-size: 10px;
          }
          .pdf-note {
            text-align: center;
            font-style: italic;
            margin: 10px 0;
            color: #666;
          }
          .record:nth-child(even) {
            background-color: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="pdf-note">Cada registro exibe informações em formato de chaves e valores agrupados.</p>
    `;

    if (data.length > 0) {
      const columns = Object.keys(data[0]);

      data.forEach((item, index) => {
        html += `
          <div class="record">
            <div class="record-header">Registro ${index + 1}</div>
            <div class="record-content">
        `;

        columns.forEach((col) => {
          const formattedLabel = this.formatColumnName(col);
          const cellValue = this.formatCellValue(item[col]);
          html += `
            <div class="field-group">
              <span class="field-label">${formattedLabel}</span>
              <span class="field-value">${cellValue}</span>
            </div>
          `;
        });

        html += `</div></div>`;
      });
    } else {
      html += `<p style="text-align: center;">Nenhum dado disponível</p>`;
    }

    html += `</body></html>`;

    return html;
  }

  private generateTableHtmlContent<T>(data: T[], title: string): string {
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 10px;
          }
          h1 {
            text-align: center;
            margin-bottom: 20px;
            color: #333;
          }
          .table-container {
            width: 100%;
            overflow-x: auto;
          }
          table {
            border-collapse: collapse;
            table-layout: auto;
          }
          th, td {
            padding: 6px;
            text-align: left;
            border: 1px solid #ddd;
            min-width: 80px;
            max-width: 250px;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            position: sticky;
            top: 0;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .truncated-text {
            color: #444;
            font-style: italic;
          }
          .truncated-text::after {
            content: " (...)";
            color: #999;
            font-weight: bold;
          }
          .pdf-note {
            text-align: center;
            font-style: italic;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="pdf-note">Use o controle de zoom ou a barra de rolagem para visualizar todas as colunas.</p>
        <div class="table-container">
    `;

    if (data.length > 0) {
      const columns = Object.keys(data[0]);

      html += `<table>
        <thead>
          <tr>
            ${columns
              .map((col) => `<th>${this.formatColumnName(col)}</th>`)
              .join('')}
          </tr>
        </thead>
        <tbody>`;

      data.forEach((item) => {
        html += `<tr>
          ${columns
            .map((col) => `<td>${this.formatCellValue(item[col])}</td>`)
            .join('')}
        </tr>`;
      });

      html += `</tbody></table>`;
    } else {
      html += `<p style="text-align: center;">No data available</p>`;
    }

    html += `</div></body></html>`;

    return html;
  }

  private formatColumnName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  }

  private formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      const isTruncated = value.length > 150;
      const truncated = truncateText(value);

      return isTruncated
        ? `<span class="truncated-text" title="${value.replace(
            /"/g,
            '&quot;',
          )}">${truncated}</span>`
        : truncated;
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }
}
