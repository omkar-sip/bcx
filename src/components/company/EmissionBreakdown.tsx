import { cx, formatPercent, formatTonnes } from '../../lib/utils';
import type { CompanyScopeMetric } from '../../types';

interface EmissionBreakdownProps {
  scopes: CompanyScopeMetric[];
}

const statusClasses: Record<CompanyScopeMetric['status'], string> = {
  critical: 'border-rose-200 bg-rose-50 text-rose-700',
  watch: 'border-amber-200 bg-amber-50 text-amber-700',
  healthy: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

export const EmissionBreakdown = ({ scopes }: EmissionBreakdownProps) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
          Emissions Hotspots
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Scope-level exposure ranked by the tonnes currently sitting in the inventory.
        </p>
      </div>
    </div>

    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      {scopes.map((scope) => {
        const width = Math.max(8, Math.round(scope.share * 100));
        return (
          <article key={scope.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-brand-ink">{scope.label}</p>
                <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-ink">
                  {formatTonnes(scope.tonnes)}
                </p>
              </div>
              <span
                className={cx(
                  'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
                  statusClasses[scope.status]
                )}
              >
                {scope.status}
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-orange to-orange-300"
                style={{ width: `${width}%` }}
              />
            </div>

            <p className="mt-2 font-mono text-xs text-slate-500">{formatPercent(scope.share)}</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">{scope.driver}</p>
            <p className="mt-3 text-sm font-semibold text-brand-ink">{scope.insight}</p>
          </article>
        );
      })}
    </div>
  </section>
);
