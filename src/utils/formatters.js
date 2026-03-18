const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

export function normalizeDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const parsed = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return currencyFormatter.format(value);
}

export function formatDate(value) {
  const date = normalizeDateValue(value);
  return date ? dateTimeFormatter.format(date) : '—';
}

export function formatRelativeFromNow(value) {
  const date = normalizeDateValue(value);
  if (!date) return '—';

  const diff = Math.max(0, Date.now() - date.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';

  return `${days}d ago`;
}
