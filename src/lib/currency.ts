export const CURRENCY = {
  symbol: '€',
  code: 'EUR',
  locale: 'pt-PT',
  position: 'after' as const,
};

export function formatCurrency(amount: number): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return safeAmount.toLocaleString(CURRENCY.locale, {
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

export function calculatePercentage(current: number, target: number, maxValue: number = 100): number {
  if (!target || target <= 0 || !Number.isFinite(target)) {
    return 0;
  }
  const percentage = (current / target) * 100;
  return Math.min(Math.max(percentage, 0), maxValue);
}

export function calculateMonthChange(income: number, expenses: number): string {
  if (!income || income <= 0 || !Number.isFinite(income)) {
    return "0";
  }
  return ((income - expenses) / income * 100).toFixed(0);
}