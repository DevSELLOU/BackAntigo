import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './entities/product.entity';
import { DimensionUnit, WeightUnit } from './enums/product-units.enum';

const DIMENSION_FACTOR = {
  [DimensionUnit.Millimeter]: 1,
  [DimensionUnit.Centimeter]: 10,
  [DimensionUnit.Meter]: 1000,
};

const WEIGHT_FACTOR = {
  [WeightUnit.Gram]: 1,
  [WeightUnit.Kilogram]: 1000,
};

function parseBrazilianNumber(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  const str = String(value).trim();
  if (str === '') {
    return null;
  }
  const lastCommaIndex = str.lastIndexOf(',');
  const lastDotIndex = str.lastIndexOf('.');
  let normalized: string;
  if (lastCommaIndex > lastDotIndex) {
    normalized = str.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = str.replace(/,/g, '');
  }
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}

function parseDimensionFromInput(
  inputValue: string | number | null,
  unit: DimensionUnit,
): number | null {
  const parsed = parseBrazilianNumber(inputValue);
  if (parsed === null) return null;
  return parsed * (DIMENSION_FACTOR[unit] || 1);
}

function parseWeightFromInput(
  inputValue: string | number | null,
  unit: WeightUnit,
): number | null {
  const parsed = parseBrazilianNumber(inputValue);
  if (parsed === null) return null;
  return parsed * (WEIGHT_FACTOR[unit] || 1);
}

function formatToBrazilianNumber(
  value: number | null | undefined,
  decimals: number = 2,
): string | null {
  if (value === null || value === undefined) return null;
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function convertFromBaseUnit(
  baseValue: number | null,
  targetUnit: DimensionUnit | WeightUnit,
  type: 'dimension' | 'weight',
): number | null {
  if (baseValue === null) return null;
  const conversions = type === 'dimension' ? DIMENSION_FACTOR : WEIGHT_FACTOR;
  const factor = conversions[targetUnit as keyof typeof conversions];
  if (factor === undefined) return null;
  return baseValue / factor;
}

function formatDimensionForResponse(
  baseValue: number | null,
  unit: string,
): string | null {
  if (baseValue === null) return null;
  const unitEnum = (unit as DimensionUnit) || DimensionUnit.Centimeter;
  const converted = convertFromBaseUnit(baseValue, unitEnum, 'dimension');
  const decimals = unitEnum === DimensionUnit.Millimeter ? 0 : 2;
  return formatToBrazilianNumber(converted, decimals);
}

function formatWeightForResponse(
  baseValue: number | null,
  unit: string,
): string | null {
  if (baseValue === null) return null;
  const unitEnum = (unit as WeightUnit) || WeightUnit.Kilogram;
  const converted = convertFromBaseUnit(baseValue, unitEnum, 'weight');
  const decimals = unitEnum === WeightUnit.Gram ? 0 : 3;
  return formatToBrazilianNumber(converted, decimals);
}

@Injectable()
export class ProductsMapper {
  constructor() {}

  async createProductDtoToProduct(
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    const product = new Product();

    const {
      height,
      length,
      width,
      netWeight,
      thickness,
      heightUnit,
      lengthUnit,
      widthUnit,
      weightUnit,
      thicknessUnit,
      ...rest
    } = createProductDto;

    product.height = parseDimensionFromInput(
      height || null,
      (heightUnit as DimensionUnit) || DimensionUnit.Centimeter,
    );
    product.length = parseDimensionFromInput(
      length || null,
      (lengthUnit as DimensionUnit) || DimensionUnit.Centimeter,
    );
    product.width = parseDimensionFromInput(
      width || null,
      (widthUnit as DimensionUnit) || DimensionUnit.Centimeter,
    );
    product.netWeight = parseWeightFromInput(
      netWeight || null,
      (weightUnit as WeightUnit) || WeightUnit.Kilogram,
    );
    product.thickness = parseDimensionFromInput(
      thickness || null,
      (thicknessUnit as DimensionUnit) || DimensionUnit.Centimeter,
    );

    product.heightUnit = heightUnit || DimensionUnit.Centimeter;
    product.lengthUnit = lengthUnit || DimensionUnit.Centimeter;
    product.widthUnit = widthUnit || DimensionUnit.Centimeter;
    product.weightUnit = weightUnit || WeightUnit.Kilogram;
    product.thicknessUnit = thicknessUnit || DimensionUnit.Centimeter;

    createProductDto.photos = [];
    Object.assign(product, rest);
    return product;
  }

  async updateProductDtoToProduct(
    currentProduct: Product,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const {
      height,
      length,
      width,
      netWeight,
      thickness,
      heightUnit,
      lengthUnit,
      widthUnit,
      weightUnit,
      thicknessUnit,
      ...rest
    } = updateProductDto;

    if (height !== undefined) {
      currentProduct.height = parseDimensionFromInput(
        height || null,
        (heightUnit as DimensionUnit) || DimensionUnit.Centimeter,
      );
    }
    if (heightUnit) {
      currentProduct.heightUnit = heightUnit;
    }

    if (length !== undefined) {
      currentProduct.length = parseDimensionFromInput(
        length || null,
        (lengthUnit as DimensionUnit) || DimensionUnit.Centimeter,
      );
    }
    if (lengthUnit) {
      currentProduct.lengthUnit = lengthUnit;
    }

    if (width !== undefined) {
      currentProduct.width = parseDimensionFromInput(
        width || null,
        (widthUnit as DimensionUnit) || DimensionUnit.Centimeter,
      );
    }
    if (widthUnit) {
      currentProduct.widthUnit = widthUnit;
    }

    if (netWeight !== undefined) {
      currentProduct.netWeight = parseWeightFromInput(
        netWeight || null,
        (weightUnit as WeightUnit) || WeightUnit.Kilogram,
      );
    }
    if (weightUnit) {
      currentProduct.weightUnit = weightUnit;
    }

    if (thickness !== undefined) {
      currentProduct.thickness = parseDimensionFromInput(
        thickness || null,
        (thicknessUnit as DimensionUnit) || DimensionUnit.Centimeter,
      );
    }
    if (thicknessUnit) {
      currentProduct.thicknessUnit = thicknessUnit;
    }

    updateProductDto.photos = [];
    Object.entries(updateProductDto).forEach(([key, value]) => {
      if (
        value !== undefined &&
        ![
          'height',
          'length',
          'width',
          'netWeight',
          'thickness',
          'heightUnit',
          'lengthUnit',
          'widthUnit',
          'weightUnit',
          'thicknessUnit',
        ].includes(key)
      ) {
        (currentProduct as any)[key] = value;
      }
    });

    return currentProduct;
  }

  async productToResponse(product: Product): Promise<any> {
    const plain = product.get({ plain: true });

    plain.height = formatDimensionForResponse(
      product.height,
      product.heightUnit,
    );
    plain.width = formatDimensionForResponse(product.width, product.widthUnit);
    plain.length = formatDimensionForResponse(
      product.length,
      product.lengthUnit,
    );
    plain.thickness = formatDimensionForResponse(
      product.thickness,
      product.thicknessUnit,
    );
    plain.netWeight = formatWeightForResponse(
      product.netWeight,
      product.weightUnit,
    );

    return plain;
  }
}
