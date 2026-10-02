import { Injectable } from '@nestjs/common';
import { FieldMappingsRegistry } from '../registry/field-mappings-registry';

@Injectable()
export class FieldTransformerService {
  getSelectableFields(entity: string): { field: string; label: string }[] {
    const fields = FieldMappingsRegistry.getMappingsForEntity(entity);
    return fields.map(({ field, label }) => ({ field, label }));
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;

    if (path.endsWith('.length')) {
      const arrayPath = path.substring(0, path.length - 7);
      const array = this.getNestedValue(obj, arrayPath);
      return Array.isArray(array) ? array.length : undefined;
    }

    const parts = path.split('.');

    if (parts.length === 1) {
      return obj[path];
    }

    const firstKey = parts[0];
    const restOfPath = parts.slice(1).join('.');

    if (Array.isArray(obj[firstKey])) {
      if (parts.length === 1) {
        return obj[firstKey];
      }

      return obj[firstKey].map((item) => this.getNestedValue(item, restOfPath));
    }

    if (obj[firstKey] === null || obj[firstKey] === undefined) {
      return undefined;
    }

    return this.getNestedValue(obj[firstKey], restOfPath);
  }

  transformFieldNames(entity: string, data: any[]): any[] {
    if (!data || !data.length) return [];

    const mappings = FieldMappingsRegistry.getMappingsForEntity(entity);
    const allLabels = mappings.map((mapping) => mapping.label);

    return data.map((item) => {
      const result = Object.fromEntries(allLabels.map((label) => [label, '']));

      for (const mapping of mappings) {
        const { field, label, transform } = mapping;

        const value = this.getNestedValue(item, field);

        if (value !== undefined && value !== null) {
          result[label] = transform ? transform(value) : value;
        } else {
          result[label] = '';
        }
      }

      return result;
    });
  }
}
