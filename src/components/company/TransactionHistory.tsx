import { formatCompactDate, formatCurrency } from '../../lib/utils';
import type { Transaction } from '../../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
  if (!transactions.length) {
    return <p className="text-sm text-slate-500">No transactions yet.</p>;
  }

  return (
    <div className="space-y-3">
      {transactions.map((item) => (
        <article
          key={item.id}
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-bold text-brand-ink">
                  {item.sellerName ?? item.sellerId}
                </p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                  {formatCompactDate(item.timestamp)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Buyer: {item.buyerName ?? item.buyerId}
              </p>
            </div>

            <div className="grid min-w-[240px] grid-cols-3 gap-3 text-right">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Credits
                </p>
                <p className="mt-2 font-mono text-xs font-semibold text-slate-700">
                  {item.credits} tCO2e
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Rate
                </p>
                <p className="mt-2 font-mono text-xs font-semibold text-slate-700">
                  {formatCurrency(item.pricePerTonne ?? item.amount / item.credits)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Amount
                </p>
                <p className="mt-2 font-mono text-xs font-semibold text-emerald-600">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};
