// src/utils/sequelize.helpers.ts
import { DataTypes, Model, ModelStatic } from 'sequelize';

export function getAttributeDataType(
  model: ModelStatic<Model>,
  fieldName: string,
): any {
  const attribute = model.getAttributes()[fieldName];
  if (attribute) {
    return attribute.type;
  }
  return null;
}

export function isNumeric(dataType: any): boolean {
  return [
    DataTypes.INTEGER,
    DataTypes.BIGINT,
    DataTypes.DECIMAL,
    DataTypes.FLOAT,
    DataTypes.DOUBLE,
    DataTypes.REAL,
  ].some((numericType) => dataType instanceof numericType);
}
