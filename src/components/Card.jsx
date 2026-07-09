export default function Card({
  children,
  className = '',
  onClick,
}) {
  return (
    <section
      onClick={onClick}
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}