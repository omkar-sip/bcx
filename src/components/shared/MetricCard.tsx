import { cx } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'orange' | 'green' | 'blue' | 'amber';
  icon?: string;
}

const accentClassMap: Record<NonNullable<MetricCardProps['accent']>, string> = {
  orange: 'text-brand-orange',
  green: 'text-emerald-600',
  blue: 'text-blue-600',
  amber: 'text-amber-600'
};

export const MetricCard = ({
  label,
  value,
  hint,
  accent = 'orange',
  icon
}: MetricCardProps) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
      {label}
    </p>
    <p className={cx('mt-2 text-3xl font-extrabold tracking-tight', accentClassMap[accent])}>
      {value}
    </p>
    <div className="mt-2 flex items-center gap-2">
      {icon ? <span className="text-base">{icon}</span> : null}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  </article>
);
