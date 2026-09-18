export default function Button({ children, className = '', variant = 'primary', ...props }) {
  const variants = {
    primary: 'bg-leaf text-white hover:bg-leaf/90 dark:bg-emerald-600 dark:hover:bg-emerald-700',
    secondary: 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700',
    danger: 'bg-clay text-white hover:bg-clay/90 dark:bg-red-700 dark:hover:bg-red-800',
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
