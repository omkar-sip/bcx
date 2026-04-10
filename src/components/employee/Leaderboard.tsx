import { cx } from '../../lib/utils';
import type { EmployeeLeaderboardRow } from '../../store/employeeStore';

interface LeaderboardProps {
  rows: EmployeeLeaderboardRow[];
}

const rankLabel = (index: number): string => {
  if (index === 0) return '1';
  if (index === 1) return '2';
  if (index === 2) return '3';
  return `${index + 1}`;
};

export const Leaderboard = ({ rows }: LeaderboardProps) => {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">No teammates found for this company yet.</p>;
  }

  const topScore = rows[0]?.score || 1;

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const barWidth = Math.max(10, Math.round((row.score / topScore) * 100));
        return (
          <article
            key={row.uid}
            className={cx(
              'rounded-xl border bg-white p-3',
              row.isCurrentUser ? 'border-brand-orange/50' : 'border-slate-200'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-center font-mono text-xs font-semibold text-slate-600">
                {rankLabel(index)}
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-orange text-xs font-bold text-white">
                {row.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-ink">
                  {row.name}{' '}
                  {row.isCurrentUser ? (
                    <span className="rounded-full bg-brand-sand px-2 py-0.5 text-[10px] text-brand-ember">
                      YOU
                    </span>
                  ) : null}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-orange" style={{ width: `${barWidth}%` }} />
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-slate-700">{row.score}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
};
