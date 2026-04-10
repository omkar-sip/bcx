import { formatTonnes } from '../../lib/utils';
import type { BcxIndexBreakdown } from '../../types';

interface BCXIndexCardProps {
  index: number;
  baselineEmissions: number;
  grossEmissions: number;
  netEmissions: number;
  targetYear: number;
  dominantScopeLabel: string;
  breakdown: BcxIndexBreakdown;
}

const getBand = (value: number) => {
  if (value >= 75) return { label: 'Board-ready', className: 'bg-emerald-100 text-emerald-700' };
  if (value >= 55) return { label: 'Scaling', className: 'bg-amber-100 text-amber-700' };
  return { label: 'At risk', className: 'bg-rose-100 text-rose-700' };
};

const breakdownRows = (breakdown: BcxIndexBreakdown) => [
  { label: 'Reduction', score: breakdown.reduction, maxScore: 45 },
  { label: 'Participation', score: breakdown.participation, maxScore: 35 },
  { label: 'Offsets', score: breakdown.offsets, maxScore: 20 }
];

export const BCXIndexCard = ({
  index,
  baselineEmissions,
  grossEmissions,
  netEmissions,
  targetYear,
  dominantScopeLabel,
  breakdown
}: BCXIndexCardProps) => {
  const band = getBand(index);
  const operationalReduction = Math.max(0, baselineEmissions - grossEmissions);

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-ink via-slate-900 to-slate-800 p-6 text-white shadow-soft">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-300">
              BCX Index
            </h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${band.className}`}>
              {band.label}
            </span>
          </div>
          <p className="mt-4 text-5xl font-extrabold tracking-tight text-white">{index}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Operational emissions are down by {formatTonnes(operationalReduction)} from the modeled
            baseline, but {dominantScopeLabel} is still the main exposure heading into the {targetYear}{' '}
            net-zero plan.
          </p>
        </div>

        <div className="grid min-w-[220px] grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Baseline
            </p>
            <p className="mt-2 text-lg font-bold text-white">{formatTonnes(baselineEmissions)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Gross now
            </p>
            <p className="mt-2 text-lg font-bold text-white">{formatTonnes(grossEmissions)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Net after credits
            </p>
            <p className="mt-2 text-lg font-bold text-white">{formatTonnes(netEmissions)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Target year
            </p>
            <p className="mt-2 text-lg font-bold text-white">{targetYear}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {breakdownRows(breakdown).map((item) => {
          const width = Math.max(8, Math.round((item.score / item.maxScore) * 100));
          return (
            <article key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="font-mono text-xs text-slate-300">
                  {item.score}/{item.maxScore}
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-orange to-orange-300"
                  style={{ width: `${width}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
