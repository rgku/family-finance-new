export const CURRENCY = {
  symbol: '€',
  code: 'EUR',
  locale: 'pt-PT',
  position: 'after' as const,
};

export function formatCurrency(amount: number): string {
  return amount.toLocaleString(CURRENCY.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrencyWithSymbol(amount: number): string {
  const formatted = formatCurrency(amount);
  return CURRENCY.position === 'after' 
    ? `${formatted}€` 
    : `€${formatted}`;
}