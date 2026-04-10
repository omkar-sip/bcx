import type { EcoAction } from '../../types';

interface ActionGridProps {
  onLog: (actionLabel: string, type: EcoAction['type'], pts: number) => void;
}

const actionButtons: Array<{
  label: string;
  type: EcoAction['type'];
  pts: number;
  icon: string;
  hint: string;
}> = [
  {
    label: 'Cycled to work',
    type: 'bike',
    pts: 15,
    icon: 'CY',
    hint: 'Strong commute reduction signal with zero-emission travel.'
  },
  {
    label: 'Public transport',
    type: 'bus',
    pts: 10,
    icon: 'PT',
    hint: 'Improves company commute intensity without requiring full remote work.'
  },
  {
    label: 'Worked from home',
    type: 'wfh',
    pts: 18,
    icon: 'WF',
    hint: 'Avoids a full commute and gives the company a cleaner Scope 3 data point.'
  },
  {
    label: 'Carpooled with a teammate',
    type: 'carpool',
    pts: 12,
    icon: 'CP',
    hint: 'A practical middle ground when solo driving is hard to avoid.'
  },
  {
    label: 'Saved electricity',
    type: 'electricity',
    pts: 12,
    icon: 'EL',
    hint: 'Captures day-to-day energy discipline beyond commuting.'
  },
  {
    label: 'Drove car',
    type: 'car',
    pts: -5,
    icon: 'CR',
    hint: 'Important to log honestly so BCX sees the real commute baseline.'
  }
];

export const ActionGrid = ({ onLog }: ActionGridProps) => (
  <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 xl:grid-cols-3">
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
        <p className="mt-2 text-xs leading-5 text-slate-500">{item.hint}</p>
        <p
          className={`mt-3 font-mono text-xs font-semibold ${
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
