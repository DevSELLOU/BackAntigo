export interface ReportsQuery {
  months?: string | string[];
  years?: string | string[];
}

export function normaliseListParam(
  value: string | string[] | undefined,
): string[] | undefined {
  if (Array.isArray(value)) return value;
  if (value !== null && value !== undefined) return [value];
  return undefined;
}

export function parseReportsQuery(query: ReportsQuery): {
  months?: string[];
  years?: string[];
} {
  const months = normaliseListParam(query.months);
  const years = normaliseListParam(query.years);

  if (months && months.length > 0 && months.every((m) => m.length <= 2)) {
    const yearList =
      years && years.length > 0 ? years : [new Date().getFullYear().toString()];
    return {
      months: yearList.flatMap((y) => months.map((m) => `${y}-${m}`)),
      years: undefined,
    };
  }

  return { months, years };
}
