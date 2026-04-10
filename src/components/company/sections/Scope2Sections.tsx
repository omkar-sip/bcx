/**
 * Scope 2 sections – electricity and heating/cooling input
 */
import { useCompanyInputStore } from '../../../store/companyInputStore';

const Field = ({
  id, label, unit, value, onChange, hint,
}: {
  id: string; label: string; unit: string; value: string;
  onChange: (v: string) => void; hint?: string;
}) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
      {label}
    </label>
    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/15">
      <input
        id={id}
        type="number" min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="flex-1 bg-transparent px-3 py-2.5 text-sm font-semibold text-brand-ink outline-none placeholder:font-normal placeholder:text-slate-300"
      />
      <span className="flex items-center border-l border-slate-100 bg-slate-50 px-3 text-xs font-medium text-slate-500">
        {unit}
      </span>
    </div>
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

const SectionHeader = ({ title, desc, badge, badgeColor = 'blue' }: {
  title: string; desc: string; badge: string;
  badgeColor?: 'blue' | 'emerald';
}) => (
  <div>
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeColor === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
      {badge}
    </span>
    <h2 className="mt-2 text-xl font-extrabold text-brand-ink">{title}</h2>
    <p className="mt-1 max-w-xl text-sm text-slate-500">{desc}</p>
  </div>
);

export const Scope2ElecSection = () => {
  const { scope2, updateScope2, emissions } = useCompanyInputStore();

  const renewablePct = Math.min(100, Math.max(0, parseFloat(scope2.renewablePercent || '0')));
  const gridFraction = 1 - renewablePct / 100;

  return (
    <div className="space-y-8">
      <SectionHeader
        badge="Scope 2 – Indirect"
        title="Electricity Consumption"
        desc="Enter your annual electricity use. Renewable procurement reduces your market-based Scope 2 emissions."
      />

      {emissions.scope2 > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
          <p className="text-sm font-semibold text-blue-700">
            Scope 2 generating{' '}
            <span className="text-xl font-extrabold">
              {emissions.scope2.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCO₂e
            </span>
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="s2-kwh" label="Total Electricity Used" unit="kWh"
            value={scope2.electricityKwh} onChange={(v) => updateScope2({ electricityKwh: v })}
            hint="Annual consumption from all meters across all sites"
          />
          <div className="space-y-1">
            <label htmlFor="s2-renewable" className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Renewable %
            </label>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/15">
              <input
                id="s2-renewable"
                type="range" min="0" max="100"
                value={scope2.renewablePercent || '0'}
                onChange={(e) => updateScope2({ renewablePercent: e.target.value })}
                className="flex-1 accent-blue-500 px-3 py-2.5"
              />
              <span className="flex items-center border-l border-slate-100 bg-slate-50 px-3 text-xs font-bold text-blue-600 min-w-[52px] justify-center">
                {Math.round(parseFloat(scope2.renewablePercent || '0'))}%
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {renewablePct > 0
                ? `${renewablePct}% renewable → only ${Math.round(gridFraction * 100)}% counted as Scope 2`
                : 'Drag to set renewable energy %'}
            </p>
          </div>
        </div>

        {/* Renewable bar visual */}
        {parseFloat(scope2.electricityKwh || '0') > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Grid electricity (Scope 2)</span>
              <span>Renewable (excluded)</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-blue-400 transition-all"
                style={{ width: `${100 - renewablePct}%` }}
              />
              <div
                className="bg-emerald-400 transition-all"
                style={{ width: `${renewablePct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-500">Scope 2 Total</p>
        <p className="mt-1 text-3xl font-extrabold text-blue-600">
          {emissions.scope2.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCO₂e
        </p>
        <p className="mt-1 text-xs text-blue-400">Market-based, renewable deducted</p>
      </div>
    </div>
  );
};

export const Scope2HeatingSection = () => {
  const { scope2, updateScope2, emissions } = useCompanyInputStore();

  return (
    <div className="space-y-8">
      <SectionHeader
        badge="Scope 2 – Indirect"
        title="Heating & Cooling"
        desc="District heating, steam, and cooling purchased from external sources."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <Field
          id="s2-heating" label="Purchased Heating / Cooling" unit="kWh"
          value={scope2.heatingKwh} onChange={(v) => updateScope2({ heatingKwh: v })}
          hint="Energy purchased as heat, steam, or chilled water (not covered by electricity meter)"
        />
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-500">Scope 2 Total (all sources)</p>
        <p className="mt-1 text-3xl font-extrabold text-blue-600">
          {emissions.scope2.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCO₂e
        </p>
      </div>
    </div>
  );
};
