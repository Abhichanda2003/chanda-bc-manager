import Card from './Card.jsx';

export default function MetricCard({ icon: Icon, label, value, tone = 'leaf' }) {
  const colors = {
    leaf: 'bg-emerald-50 dark:bg-emerald-950 text-leaf dark:text-emerald-400',
    gold: 'bg-amber-50 dark:bg-amber-950 text-gold dark:text-amber-400',
    clay: 'bg-red-50 dark:bg-red-950 text-clay dark:text-red-400',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  };

  return (
    <Card className="p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-normal text-ink dark:text-slate-100">{value}</p>
        </div>
        <span className={`rounded-md p-2 ${colors[tone]}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}
