const currencyFormatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
});

export function normalizeDateValue(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const parsed = new Date(String(v).replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return currencyFormatter.format(value);
}

export function formatDate(value) {
  const d = normalizeDateValue(value);
  return d ? dateTimeFormatter.format(d) : '—';
}

export function formatRelativeFromNow(v) {
  const d = normalizeDateValue(v);
  if (!d) return '—';
  const diff = Math.max(0, Date.now() - d.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}
