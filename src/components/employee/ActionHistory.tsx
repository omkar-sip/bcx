import { formatCompactDate } from '../../lib/utils';
import type { EcoAction } from '../../types';

interface ActionHistoryProps {
  actions: EcoAction[];
}

export const ActionHistory = ({ actions }: ActionHistoryProps) => {
  if (!actions.length) {
    return <p className="text-sm text-slate-500">No logged actions yet. Start with a quick action.</p>;
  }

  return (
    <div className="space-y-2">
      {actions.slice(0, 12).map((item) => (
        <article
          key={item.id}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
        >
          <div>
            <p className="text-sm font-semibold text-brand-ink">{item.action}</p>
            <p className="font-mono text-xs text-slate-500">{formatCompactDate(item.timestamp)}</p>
          </div>
          <p className={`font-mono text-xs font-semibold ${item.pts >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {item.pts >= 0 ? '+' : ''}
            {item.pts} pts
          </p>
        </article>
      ))}
    </div>
  );
};
