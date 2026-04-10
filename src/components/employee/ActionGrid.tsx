import { useState } from 'react';
import type { EcoAction } from '../../types';
import { cx } from '../../lib/utils';

interface ActionGridProps {
  onLog: (actionLabel: string, type: EcoAction['type'], pts: number, value?: number, unit?: string) => void;
}

const actionButtons: Array<{
  label: string;
  type: EcoAction['type'];
  basePts: number;
  icon: string;
  hint: string;
  unit: string;
  impactFactor: number; // pts per unit
}> = [
  {
    label: 'Cycled to work',
    type: 'bike',
    basePts: 5,
    icon: 'CY',
    hint: 'Bicycle commute — zero emissions.',
    unit: 'km',
    impactFactor: 2 // 2 pts per km
  },
  {
    label: 'Public transport',
    type: 'bus',
    basePts: 5,
    icon: 'PT',
    hint: 'Bus or metro commute.',
    unit: 'km',
    impactFactor: 1
  },
  {
    label: 'Worked from home',
    type: 'wfh',
    basePts: 10,
    icon: 'WF',
    hint: 'Remote work preventing full commute.',
    unit: 'days',
    impactFactor: 5
  },
  {
    label: 'Carpooled with teammate',
    type: 'carpool',
    basePts: 5,
    icon: 'CP',
    hint: 'Shared ride to office.',
    unit: 'km',
    impactFactor: 1.5
  },
  {
    label: 'Saved electricity',
    type: 'electricity',
    basePts: 0,
    icon: 'EL',
    hint: 'Reduced office or home energy use.',
    unit: 'kWh',
    impactFactor: 3
  },
  {
    label: 'Drove solo car',
    type: 'car',
    basePts: -5,
    icon: 'CR',
    hint: 'Important for accurate company baselines.',
    unit: 'km',
    impactFactor: -1
  }
];

export const ActionGrid = ({ onLog }: ActionGridProps) => {
  const [selectedAction, setSelectedAction] = useState<typeof actionButtons[0] | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  const handleLog = () => {
    if (!selectedAction || !inputValue) return;
    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) return;
    
    const pts = Math.round(selectedAction.basePts + (val * selectedAction.impactFactor));
    onLog(selectedAction.label, selectedAction.type, pts, val, selectedAction.unit);
    
    setSelectedAction(null);
    setInputValue('');
  };

  return (
    <div className="space-y-4">
      {selectedAction ? (
        <div className="p-5 border-2 border-brand-orange rounded-2xl bg-orange-50/50 shadow-sm transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-white text-sm font-bold text-brand-orange shadow-sm">
                {selectedAction.icon}
              </span>
              <div>
                <p className="font-bold text-brand-ink">{selectedAction.label}</p>
                <p className="text-xs text-slate-500">{selectedAction.hint}</p>
              </div>
            </div>
            <button onClick={() => setSelectedAction(null)} className="text-slate-400 hover:text-slate-600 transition p-1">
              ✕
            </button>
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden shadow-sm flex-1">
              <input
                type="number"
                autoFocus
                className="w-full px-4 py-2 outline-none text-brand-ink font-semibold"
                placeholder={`Enter ${selectedAction.unit}...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLog()}
              />
              <span className="px-4 text-sm font-medium text-slate-400 border-l border-slate-100 bg-slate-50 h-full flex items-center">
                {selectedAction.unit}
              </span>
            </div>
            <button
              onClick={handleLog}
              disabled={!inputValue || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0}
              className="bg-brand-orange text-white px-6 py-2 rounded-xl font-bold shadow-sm hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Log Data
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 xl:grid-cols-3">
          {actionButtons.map((item) => (
            <button
              key={item.label}
              type="button"
              className="group rounded-2xl border-2 border-slate-200 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-brand-orange"
              onClick={() => setSelectedAction(item)}
            >
              <span className="inline-grid h-9 w-9 place-items-center rounded-lg bg-brand-sand text-xs font-bold text-brand-ember group-hover:bg-brand-orange group-hover:text-white transition-colors">
                {item.icon}
              </span>
              <p className="mt-3 text-sm font-bold text-brand-ink">{item.label}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{item.hint}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
