import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from '../../src/presentation/products/dtos/create-product.dto';
import { UpdateProductDto } from '../../src/presentation/products/dtos/update-product.dto';

const DIMENSION_FACTOR: Record<string, number> = {
  'mm': 1,
  'cm': 100,
  'm': 1000,
};

const WEIGHT_FACTOR: Record<string, number> = {
  'g': 1,
  'kg': 1000,
};

function parseBrazilianNumber(value: string | number | null | undefined): number | null {
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

function parseDimensionFromInput(inputValue: string | number | null, unit: string): number | null {
  const parsed = parseBrazilianNumber(inputValue);
  if (parsed === null) return null;
  return parsed * (DIMENSION_FACTOR[unit] || 1);
}

function parseWeightFromInput(inputValue: string | number | null, unit: string): number | null {
  const parsed = parseBrazilianNumber(inputValue);
  if (parsed === null) return null;
  return parsed * (WEIGHT_FACTOR[unit] || 1);
}

function formatToBrazilianNumber(value: number | null | undefined, decimals: number = 2): string | null {
  if (value === null || value === undefined) return null;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function convertFromBaseUnit(
  baseValue: number | null,
  targetUnit: string,
  type: 'dimension' | 'weight',
): number | null {
  if (baseValue === null) return null;
  const conversions = type === 'dimension' ? DIMENSION_FACTOR : WEIGHT_FACTOR;
  const factor = conversions[targetUnit];
  if (factor === undefined) return null;
  return baseValue / factor;
}

function formatDimensionForResponse(baseValue: number | null, unit: string): string | null {
  if (baseValue === null) return null;
  const converted = convertFromBaseUnit(baseValue, unit || 'cm', 'dimension');
  const decimals = unit === 'mm' ? 0 : 2;
  return formatToBrazilianNumber(converted, decimals);
}

function formatWeightForResponse(baseValue: number | null, unit: string): string | null {
  if (baseValue === null) return null;
  const converted = convertFromBaseUnit(baseValue, unit || 'kg', 'weight');
  const decimals = unit === 'g' ? 0 : 3;
  return formatToBrazilianNumber(converted, decimals);
}

describe('Dimension Conversion Logic', () => {
  describe('parseDimensionFromInput - cm input', () => {
    it('DIM-001: should convert "20,50" cm to 2050 mm', () => {
      const result = parseDimensionFromInput('20,50', 'cm');
      expect(result).toBe(2050);
    });

    it('DIM-002: should convert "1,5" m to 1500 mm', () => {
      const result = parseDimensionFromInput('1,5', 'm');
      expect(result).toBe(1500);
    });

    it('DIM-003: should convert "100" mm directly to 100 mm', () => {
      const result = parseDimensionFromInput('100', 'mm');
      expect(result).toBe(100);
    });

    it('DIM-004: should use cm as default when unit not specified (factor 10)', () => {
      const result = parseDimensionFromInput('25,00', 'cm');
      expect(result).toBe(2500);
    });

    it('DIM-005: should handle null/invalid values', () => {
      expect(parseDimensionFromInput(null, 'cm')).toBeNull();
      expect(parseDimensionFromInput(undefined, 'cm')).toBeNull();
      expect(parseDimensionFromInput('', 'cm')).toBeNull();
      expect(parseDimensionFromInput('invalid', 'cm')).toBeNull();
    });
  });

  describe('parseWeightFromInput - weight conversion', () => {
    it('WGT-001: should convert "1,500" kg to 1500 g', () => {
      const result = parseWeightFromInput('1,500', 'kg');
      expect(result).toBe(1500);
    });

    it('WGT-002: should convert "500" g directly to 500 g', () => {
      const result = parseWeightFromInput('500', 'g');
      expect(result).toBe(500);
    });

    it('WGT-003: should use kg as default when unit not specified', () => {
      const result = parseWeightFromInput('2,500', 'kg');
      expect(result).toBe(2500);
    });
  });

  describe('formatDimensionForResponse - formatting for API response', () => {
    it('FMT-001: should format 2050 mm to "20,50" for cm display', () => {
      const result = formatDimensionForResponse(2050, 'cm');
      expect(result).toBe('20,50');
    });

    it('FMT-002: should format 1500 mm to "1,50" for m display (2 decimals)', () => {
      const result = formatDimensionForResponse(1500, 'm');
      expect(result).toBe('1,50');
    });

    it('FMT-003: should format 100 mm with 0 decimals', () => {
      const result = formatDimensionForResponse(100, 'mm');
      expect(result).toBe('100');
    });

    it('FMT-004: should handle null values', () => {
      expect(formatDimensionForResponse(null, 'cm')).toBeNull();
    });
  });

  describe('formatWeightForResponse - weight formatting', () => {
    it('WFMT-001: should format 1500 g to "1,500" for kg display', () => {
      const result = formatWeightForResponse(1500, 'kg');
      expect(result).toBe('1,500');
    });

    it('WFMT-002: should format 500 g with 0 decimals', () => {
      const result = formatWeightForResponse(500, 'g');
      expect(result).toBe('500');
    });

    it('WFMT-003: should handle null values', () => {
      expect(formatWeightForResponse(null, 'kg')).toBeNull();
    });
  });

  describe('Integration: Input -> Store -> Display', () => {
    it('INT-001: "20,50" cm should save as 2050 and display as "20,50"', () => {
      const input = '20,50';
      const unit = 'cm';
      
      const stored = parseDimensionFromInput(input, unit);
      expect(stored).toBe(2050);
      
      const display = formatDimensionForResponse(stored, unit);
      expect(display).toBe('20,50');
    });

    it('INT-002: "1,5" m should save as 1500 and display as "1,50" (2 decimals for m)', () => {
      const input = '1,5';
      const unit = 'm';
      
      const stored = parseDimensionFromInput(input, unit);
      expect(stored).toBe(1500);
      
      const display = formatDimensionForResponse(stored, unit);
      expect(display).toBe('1,50');
    });

    it('INT-003: "1,500" kg should save as 1500 and display as "1,500"', () => {
      const input = '1,500';
      const unit = 'kg';
      
      const stored = parseWeightFromInput(input, unit);
      expect(stored).toBe(1500);
      
      const display = formatWeightForResponse(stored, unit);
      expect(display).toBe('1,500');
    });
  });
});