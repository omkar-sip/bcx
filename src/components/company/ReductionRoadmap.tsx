import { formatCurrency, formatTonnes } from '../../lib/utils';
import type { AbatementInitiative } from '../../types';

interface ReductionRoadmapProps {
  initiatives: AbatementInitiative[];
}

const priorityStyles: Record<AbatementInitiative['priority'], string> = {
  Now: 'bg-rose-100 text-rose-700',
  Next: 'bg-amber-100 text-amber-700',
  Monitor: 'bg-slate-100 text-slate-700'
};

export const ReductionRoadmap = ({ initiatives }: ReductionRoadmapProps) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
        Decarbonization Roadmap
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Prioritized initiatives ranked by strategic urgency, reduction potential, and payback.
      </p>
    </div>

    <div className="mt-4 space-y-3">
      {initiatives.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-brand-ink">{item.title}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${priorityStyles[item.priority]}`}
                >
                  {item.priority}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>

            <div className="grid min-w-[220px] grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Abatement
                </p>
                <p className="mt-2 font-bold text-brand-ink">{formatTonnes(item.reductionTonnes)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Payback
                </p>
                <p className="mt-2 font-bold text-brand-ink">{item.paybackMonths} months</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Budget
                </p>
                <p className="mt-2 font-bold text-brand-ink">{formatCurrency(item.investment)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Owner
                </p>
                <p className="mt-2 font-bold text-brand-ink">{item.owner}</p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);
