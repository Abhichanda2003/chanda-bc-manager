import Card from './Card.jsx';

export default function MetricCard({ icon: Icon, label, value, tone = 'leaf' }) {
  const colors = {
    leaf: 'bg-emerald-50 text-leaf',
    gold: 'bg-amber-50 text-gold',
    clay: 'bg-red-50 text-clay',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <Card className="bg-white/95 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-normal">{value}</p>
        </div>
        <span className={`rounded-md p-2 ${colors[tone]}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}
