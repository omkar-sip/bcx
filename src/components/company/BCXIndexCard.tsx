interface BCXIndexCardProps {
  index: number;
  employeeCount: number;
  totalScore: number;
}

const getBand = (value: number) => {
  if (value >= 70) return { label: 'Gold', className: 'bg-amber-100 text-amber-700' };
  if (value >= 40) return { label: 'Silver', className: 'bg-slate-100 text-slate-700' };
  return { label: 'Bronze', className: 'bg-orange-100 text-orange-700' };
};

export const BCXIndexCard = ({ index, employeeCount, totalScore }: BCXIndexCardProps) => {
  const band = getBand(index);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">BCX Index</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${band.className}`}>
          {band.label}
        </span>
      </div>

      <p className="mt-3 text-4xl font-extrabold tracking-tight text-brand-orange">{index}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-orange to-orange-300" style={{ width: `${index}%` }} />
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {employeeCount} employees contributing | total team score {totalScore}
      </p>
    </section>
  );
};
