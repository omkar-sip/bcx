import { cx } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export const Tabs = ({ items, activeId, onChange }: TabsProps) => (
  <div
    className="grid gap-2 rounded-xl bg-slate-100 p-1"
    style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
  >
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => onChange(item.id)}
        className={cx(
          'rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm',
          activeId === item.id
            ? 'bg-white text-brand-orange shadow-soft'
            : 'text-slate-500 hover:text-brand-ink'
        )}
      >
        {item.label}
      </button>
    ))}
  </div>
);
