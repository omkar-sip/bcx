import { formatCurrency } from '../../lib/utils';
import type { MarketplaceCredit } from '../../types';

interface MarketplaceProps {
  listings: MarketplaceCredit[];
  creditsToNeutralize: number;
  onBuy: (farmerId: string, credits: number) => void;
}

const getQualityLabel = (verificationScore: number): string => {
  if (verificationScore >= 90) return 'Prime verified';
  if (verificationScore >= 80) return 'Verified';
  return 'Emerging';
};

export const Marketplace = ({ listings, creditsToNeutralize, onBuy }: MarketplaceProps) => {
  if (!listings.length) {
    return <p className="text-sm text-slate-500">No farmer listings available right now.</p>;
  }

  return (
    <div className="space-y-3">
      {listings.map((item) => {
        const suggestedFill = Math.min(item.tonnesAvailable, Math.max(5, creditsToNeutralize));

        return (
          <article
            key={item.farmerId}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-bold text-brand-ink">{item.farmerName}</p>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    {getQualityLabel(item.verificationScore)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                    {item.verificationScore}/100 score
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  {item.village} | {item.methodology}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.certifications.map((certification) => (
                    <span
                      key={certification}
                      className="rounded-full bg-brand-sand px-3 py-1 text-xs font-semibold text-brand-ember"
                    >
                      {certification}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid min-w-[260px] grid-cols-2 gap-3">
                <article className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Available
                  </p>
                  <p className="mt-2 font-bold text-brand-ink">{item.tonnesAvailable} tCO2e</p>
                </article>
                <article className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Price
                  </p>
                  <p className="mt-2 font-bold text-brand-ink">
                    {formatCurrency(item.pricePerTonne)}/t
                  </p>
                </article>
                <article className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Settlement
                  </p>
                  <p className="mt-2 font-bold text-brand-ink">{item.settlementDays} days</p>
                </article>
                <article className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Premium
                  </p>
                  <p className="mt-2 font-bold text-brand-ink">
                    {Math.round((item.priceMultiplier - 1) * 100)}%
                  </p>
                </article>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-secondary" type="button" onClick={() => onBuy(item.farmerId, 5)}>
                Buy 5t
              </button>
              <button className="btn-secondary" type="button" onClick={() => onBuy(item.farmerId, 10)}>
                Buy 10t
              </button>
              {suggestedFill > 10 ? (
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => onBuy(item.farmerId, suggestedFill)}
                >
                  Buy {suggestedFill}t toward gap
                </button>
              ) : (
                <button className="btn-primary" type="button" onClick={() => onBuy(item.farmerId, item.tonnesAvailable)}>
                  Buy full listing
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};
