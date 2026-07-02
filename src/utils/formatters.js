import dayjs from 'dayjs';

export const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  return currency.format(value || 0);
}

export function formatDate(value) {
  return value ? dayjs(value).format('DD MMM YYYY') : '-';
}

export function statusClass(status) {
  const styles = {
    Running: 'bg-emerald-100 text-emerald-800',
    Completed: 'bg-slate-200 text-slate-700',
    Upcoming: 'bg-amber-100 text-amber-800',
    Active: 'bg-emerald-100 text-emerald-800',
    Paid: 'bg-emerald-100 text-emerald-800',
    Pending: 'bg-rose-100 text-rose-800',
    Unpaid: 'bg-rose-100 text-rose-800',
  };

  return styles[status] || 'bg-slate-100 text-slate-700';
}
