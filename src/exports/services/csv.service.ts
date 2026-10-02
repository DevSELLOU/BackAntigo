import { Injectable } from '@nestjs/common';
import { Parser } from 'json2csv';

@Injectable()
export class CsvService {
  generateCsv<T>(data: T[], fields?: string[]): string {
    if (!data.length) {
      return '';
    }

    const opts = { fields: fields || Object.keys(data[0]) };
    try {
      const parser = new Parser(opts);
      return parser.parse(data);
    } catch (err) {
      throw new Error(`Error generating CSV: ${err.message}`);
    }
  }

  generateCsvRows(data: any[]): string {
    if (!data || data.length === 0) return '';

    let csvContent = '';

    // Generate content rows only (no headers)
    data.forEach((row) => {
      const values = Object.values(row).map((value) => {
        // Properly escape values that contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (
          stringValue.includes(',') ||
          stringValue.includes('"') ||
          stringValue.includes('\n')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent += values.join(',') + '\n';
    });

    return csvContent;
  }
}
