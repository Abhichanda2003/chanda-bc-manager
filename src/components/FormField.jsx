export default function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-xs font-medium text-clay dark:text-red-400">{error.message}</span>}
    </label>
  );
}
