export default function Card({
  children,
  className = '',
  onClick,
}) {
  return (
    <section
      onClick={onClick}
      className={`rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm dark:shadow-md ${className}`}
    >
      {children}
    </section>
  );
}