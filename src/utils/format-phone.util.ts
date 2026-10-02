export function formatPhone(phone: string | null | undefined): string {
  if (!phone) {
    return '';
  }
  return phone.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
}
