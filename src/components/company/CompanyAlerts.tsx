import { cx } from '../../lib/utils';
import type { CompanyAlert } from '../../types';

interface CompanyAlertsProps {
  alerts: CompanyAlert[];
}

const severityStyles: Record<CompanyAlert['severity'], string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

export const CompanyAlerts = ({ alerts }: CompanyAlertsProps) => {
  if (!alerts.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            Executive Alerts
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Focus the next operating cycle on the bottlenecks below.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className={cx(
              'rounded-2xl border p-4 transition',
              severityStyles[alert.severity]
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">{alert.title}</p>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
                {alert.severity}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6">{alert.detail}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              Recommended move
            </p>
            <p className="mt-1 text-sm">{alert.action}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
