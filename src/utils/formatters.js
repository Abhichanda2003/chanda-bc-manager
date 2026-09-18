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
    Running: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
    Completed: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
    Upcoming: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    Active: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
    Paid: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
    Pending: 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200',
    Unpaid: 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200',
  };

  return styles[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
}
