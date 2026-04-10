import { formatCurrency } from '../../lib/utils';
import type { MarketplaceCredit } from '../../types';

interface MarketplaceProps {
  listings: MarketplaceCredit[];
  onBuy: (farmerId: string, credits: number) => void;
}

export const Marketplace = ({ listings, onBuy }: MarketplaceProps) => {
  if (!listings.length) {
    return <p className="text-sm text-slate-500">No farmer listings available right now.</p>;
  }

  return (
    <div className="space-y-3">
      {listings.map((item) => (
        <article
          key={item.farmerId}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-bold text-brand-ink">{item.farmerName}</p>
            <p className="text-xs text-slate-500">
              {item.tonnesAvailable} tCO2 available at {formatCurrency(item.pricePerTonne)}/t
            </p>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary" type="button" onClick={() => onBuy(item.farmerId, 5)}>
              Buy 5t
            </button>
            <button className="btn-primary" type="button" onClick={() => onBuy(item.farmerId, 10)}>
              Buy 10t
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};
