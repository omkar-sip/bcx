import type { EcoAction } from '../../types';

interface ActionGridProps {
  onLog: (actionLabel: string, type: EcoAction['type'], pts: number) => void;
}

const actionButtons: Array<{ label: string; type: EcoAction['type']; pts: number; icon: string }> = [
  { label: 'Cycled to work', type: 'bike', pts: 15, icon: 'CY' },
  { label: 'Public transport', type: 'bus', pts: 10, icon: 'PT' },
  { label: 'Saved electricity', type: 'electricity', pts: 12, icon: 'EL' },
  { label: 'Drove car', type: 'car', pts: -5, icon: 'CR' }
];

export const ActionGrid = ({ onLog }: ActionGridProps) => (
  <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
    {actionButtons.map((item) => (
      <button
        key={item.label}
        type="button"
        className="group rounded-2xl border-2 border-slate-200 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-brand-orange"
        onClick={() => onLog(item.label, item.type, item.pts)}
      >
        <span className="inline-grid h-9 w-9 place-items-center rounded-lg bg-brand-sand text-xs font-bold text-brand-ember">
          {item.icon}
        </span>
        <p className="mt-3 text-sm font-bold text-brand-ink">{item.label}</p>
        <p
          className={`mt-1 font-mono text-xs font-semibold ${
            item.pts > 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {item.pts > 0 ? '+' : ''}
          {item.pts} pts
        </p>
      </button>
    ))}
  </div>
);
