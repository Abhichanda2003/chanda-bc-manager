export default function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-xs font-medium text-clay">{error.message}</span>}
    </label>
  );
}
