import { parseReportsQuery } from '../../src/reports/reports.query';

describe('parseReportsQuery', () => {
  it('returns undefined months and years when query is empty', () => {
    const result = parseReportsQuery({});
    expect(result.months).toBeUndefined();
    expect(result.years).toBeUndefined();
  });

  it('normalises months from string to array when in YYYY-MM format', () => {
    const result = parseReportsQuery({ months: '2026-01', years: '2026' });
    expect(result.months).toEqual(['2026-01']);
    expect(result.years).toEqual(['2026']);
  });

  it('combines MM-only months with each year to produce YYYY-MM', () => {
    const result = parseReportsQuery({
      months: '01',
      years: '2026',
    });
    expect(result.months).toEqual(['2026-01']);
    expect(result.years).toBeUndefined();
  });

  it('combines multiple MM months with single year', () => {
    const result = parseReportsQuery({
      months: ['01', '02'],
      years: '2026',
    });
    expect(result.months).toEqual(['2026-01', '2026-02']);
    expect(result.years).toBeUndefined();
  });

  it('combines MM months with multiple years (cartesian product)', () => {
    const result = parseReportsQuery({
      months: ['01', '02'],
      years: ['2025', '2026'],
    });
    expect(result.months).toEqual([
      '2025-01',
      '2025-02',
      '2026-01',
      '2026-02',
    ]);
    expect(result.years).toBeUndefined();
  });

  it('uses current year when MM months are provided without years', () => {
    const currentYear = new Date().getFullYear().toString();
    const result = parseReportsQuery({ months: '01' });
    expect(result.months).toEqual([`${currentYear}-01`]);
    expect(result.years).toBeUndefined();
  });

  it('passes through YYYY-MM months unchanged', () => {
    const result = parseReportsQuery({
      months: ['2026-01', '2026-02'],
      years: '2026',
    });
    expect(result.months).toEqual(['2026-01', '2026-02']);
    expect(result.years).toEqual(['2026']);
  });

  it('passes through mixed format (YYYY-MM stays, MM stays) since not all are <=2', () => {
    const result = parseReportsQuery({
      months: ['2026-01', '02'],
      years: '2026',
    });
    expect(result.months).toEqual(['2026-01', '02']);
    expect(result.years).toEqual(['2026']);
  });

  it('returns years when only years provided', () => {
    const result = parseReportsQuery({ years: '2026' });
    expect(result.months).toBeUndefined();
    expect(result.years).toEqual(['2026']);
  });
});
