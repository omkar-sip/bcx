export const cx = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');

export const formatCompactDate = (value: Date): string =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);

export const formatPercent = (value: number, digits = 0): string =>
  `${(value * 100).toFixed(digits)}%`;

export const formatTonnes = (value: number, digits = 1): string =>
  `${value.toFixed(digits)} tCO2e`;

export const formatKg = (value: number): string =>
  `${Math.round(value).toLocaleString('en-IN')} kg CO2e`;
