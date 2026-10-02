import { BadRequestException } from '@nestjs/common';
import { Op } from 'sequelize';
import { parseMonthYearFilters } from '../../src/presentation/orders/parse-month-year-filters';

describe('parseMonthYearFilters', () => {
  it('returns empty dateWhere when no months or years provided', () => {
    const result = parseMonthYearFilters({});
    expect(result.dateWhere).toEqual({});
    expect(result.monthRanges).toEqual([]);
    expect(result.yearRanges).toEqual([]);
  });

  it('returns empty dateWhere when months and years are empty arrays', () => {
    const result = parseMonthYearFilters({ months: [], years: [] });
    expect(result.dateWhere).toEqual({});
  });

  it('parses a single month in YYYY-MM format', () => {
    const result = parseMonthYearFilters({ months: ['2026-01'] });
    expect(result.monthRanges).toHaveLength(1);
    expect(result.yearRanges).toEqual([]);
    expect(result.dateWhere[Op.or]).toHaveLength(1);
  });

  it('parses multiple months', () => {
    const result = parseMonthYearFilters({ months: ['2026-01', '2026-02'] });
    expect(result.monthRanges).toHaveLength(2);
    expect(result.dateWhere[Op.or]).toHaveLength(2);
  });

  it('parses a single year', () => {
    const result = parseMonthYearFilters({ years: ['2026'] });
    expect(result.yearRanges).toHaveLength(1);
    expect(result.dateWhere[Op.or]).toHaveLength(1);
  });

  it('parses multiple years', () => {
    const result = parseMonthYearFilters({ years: ['2025', '2026'] });
    expect(result.yearRanges).toHaveLength(2);
    expect(result.dateWhere[Op.or]).toHaveLength(2);
  });

  it('combines months and years in a single OR', () => {
    const result = parseMonthYearFilters({
      months: ['2026-01'],
      years: ['2025'],
    });
    expect(result.monthRanges).toHaveLength(1);
    expect(result.yearRanges).toHaveLength(1);
    expect(result.dateWhere[Op.or]).toHaveLength(2);
  });

  it('throws BadRequestException for invalid month format', () => {
    expect(() =>
      parseMonthYearFilters({ months: ['invalid'] }),
    ).toThrow(BadRequestException);
  });

  it('throws BadRequestException for month with invalid month number', () => {
    expect(() =>
      parseMonthYearFilters({ months: ['2026-13'] }),
    ).toThrow(BadRequestException);
  });

  it('throws BadRequestException for invalid year format', () => {
    expect(() =>
      parseMonthYearFilters({ years: ['abc'] }),
    ).toThrow(BadRequestException);
  });

  it('creates correct date range for a month', () => {
    const result = parseMonthYearFilters({ months: ['2026-02'] });
    const [start, end] = result.monthRanges[0];
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(1);
    expect(start.getDate()).toBe(1);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(1);
    expect(end.getDate()).toBe(28);
  });

  it('creates correct date range for December', () => {
    const result = parseMonthYearFilters({ months: ['2025-12'] });
    const [start, end] = result.monthRanges[0];
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(11);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
  });

  it('creates correct date range for a full year', () => {
    const result = parseMonthYearFilters({ years: ['2026'] });
    const [start, end] = result.yearRanges[0];
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
  });
});
