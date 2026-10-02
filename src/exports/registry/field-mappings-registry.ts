import { FieldDefinition } from '../interfaces/field-definition.interface';
import { accessRequestFieldMappings } from '../mappings/access-request-field-mappings';
import { categoryFieldMappings } from '../mappings/category-field-mappings';
import { companyFieldMappings } from '../mappings/company-field-mappings';
import { customerClientFieldMappings } from '../mappings/customer-client-field-mappings';
import { customerFieldMappings } from '../mappings/customer-field-mappings';
import { orderFieldMappings } from '../mappings/order-field-mappings';
import { paymentConditionFieldMappings } from '../mappings/payment-condition-field-mappings';
import { paymentMethodFieldMappings } from '../mappings/payment-method-field-mappings';
import { priceTableFieldMappings } from '../mappings/price-table-field-mappings';
import { productFieldMappings } from '../mappings/product-field-mappings';
import { segmentFieldMappings } from '../mappings/segment-field-mappings';
import { userFieldMappings } from '../mappings/user-field-mappings';

export class FieldMappingsRegistry {
  private static readonly mappings: Record<string, FieldDefinition[]> = {
    users: userFieldMappings,
    companies: companyFieldMappings,
    accessRequests: accessRequestFieldMappings,
    categories: categoryFieldMappings,
    customers: customerFieldMappings,
    customerClients: customerClientFieldMappings,
    orders: orderFieldMappings,
    paymentConditions: paymentConditionFieldMappings,
    paymentMethods: paymentMethodFieldMappings,
    priceTables: priceTableFieldMappings,
    products: productFieldMappings,
    segments: segmentFieldMappings,
  };

  static getMappingsForEntity(entity: string): FieldDefinition[] {
    return this.mappings[entity] || [];
  }

  static registerMappings(entity: string, mappings: FieldDefinition[]): void {
    this.mappings[entity] = mappings;
  }
}
