export interface FieldDefinition {
  field: string;
  label: string;
  transform?: (value: any) => string;
}
