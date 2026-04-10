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
    <div className="space-y-2">
      {transactions.map((item) => (
        <article
          key={item.id}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
        >
          <div>
            <p className="text-sm font-semibold text-brand-ink">Farmer ID: {item.sellerId}</p>
            <p className="font-mono text-xs text-slate-500">{formatCompactDate(item.timestamp)}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs font-semibold text-slate-700">{item.credits} tCO2</p>
            <p className="font-mono text-xs font-semibold text-emerald-600">
              {formatCurrency(item.amount)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
};
