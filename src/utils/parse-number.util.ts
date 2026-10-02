export function parseNumber(
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

export function formatPrice(value: number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
