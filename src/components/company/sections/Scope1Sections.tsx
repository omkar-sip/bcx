/**
 * Scope1Section – data input for direct (Scope 1) emissions
 */
import { useCompanyInputStore } from '../../../store/companyInputStore';
import { cx } from '../../../lib/utils';

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
        type="number"
        min="0"
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

const SectionHeader = ({ title, desc, badge }: { title: string; desc: string; badge: string }) => (
  <div className="flex items-start gap-4">
    <div>
      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600">
        {badge}
      </span>
      <h2 className="mt-2 text-xl font-extrabold text-brand-ink">{title}</h2>
      <p className="mt-1 max-w-xl text-sm text-slate-500">{desc}</p>
    </div>
  </div>
);

export const Scope1FuelSection = () => {
  const { scope1, updateScope1, emissions } = useCompanyInputStore();

  const fuelEmissions = parseFloat(scope1.fuelLitres || '0') * 0.00268 +
    parseFloat(scope1.lpgKg || '0') * 0.00296 +
    parseFloat(scope1.generatorLitres || '0') * 0.00268;

  return (
    <div className="space-y-8">
      <SectionHeader
        badge="Scope 1 – Direct"
        title="Fuel Combustion"
        desc="Enter the volume of fuels burned in your stationary and mobile equipment. Emissions update in real time."
      />

      {/* Live calculation banner */}
      {fuelEmissions > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
          <div className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
          <p className="text-sm font-semibold text-orange-700">
            These inputs generate{' '}
            <span className="text-xl font-extrabold">{fuelEmissions.toFixed(2)} tCO₂e</span>
            {' '}from fuel combustion
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <p className="text-sm font-bold text-brand-ink border-b border-slate-100 pb-3">Diesel / Petrol</p>
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="s1-fuel-litres" label="Vehicle & Equipment Fuel" unit="litres"
            value={scope1.fuelLitres} onChange={(v) => updateScope1({ fuelLitres: v })}
            hint="Total diesel / petrol consumed across all vehicles and equipment"
          />
          <Field
            id="s1-fleet-km" label="Total Fleet Distance" unit="km"
            value={scope1.fleetKm} onChange={(v) => updateScope1({ fleetKm: v })}
            hint="Optional – used to cross-check fuel efficiency"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <p className="text-sm font-bold text-brand-ink border-b border-slate-100 pb-3">LPG & Generator Fuel</p>
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="s1-lpg" label="LPG Consumed" unit="kg"
            value={scope1.lpgKg} onChange={(v) => updateScope1({ lpgKg: v })}
            hint="Cooking, heating, or process LPG"
          />
          <Field
            id="s1-generator" label="Generator Diesel" unit="litres"
            value={scope1.generatorLitres} onChange={(v) => updateScope1({ generatorLitres: v })}
            hint="DG set fuel use for backup power"
          />
        </div>
      </div>

      {/* Scope 1 total */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-500">Scope 1 Total</p>
        <p className="mt-1 text-3xl font-extrabold text-orange-600">
          {emissions.scope1.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCO₂e
        </p>
        <p className="mt-1 text-xs text-orange-400">Updates live as you type</p>
      </div>
    </div>
  );
};

export const Scope1FleetSection = () => {
  const { vehicles, addVehicle, updateVehicle, removeVehicle } = useCompanyInputStore();

  const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'electric'] as const;
  const VEHICLE_TYPES = ['car', 'truck', 'bus', 'two-wheeler'] as const;

  return (
    <div className="space-y-8">
      <SectionHeader
        badge="Scope 1 – Direct"
        title="Fleet & Vehicles"
        desc="Add each vehicle or vehicle group. Emissions from non-electric vehicles are calculated per km driven."
      />

      <div className="space-y-3">
        {vehicles.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
            <p className="text-slate-400 text-sm">No vehicles added yet.</p>
            <p className="text-slate-300 text-xs mt-1">Click "Add Vehicle" to get started.</p>
          </div>
        )}

        {vehicles.map((v, idx) => (
          <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">Vehicle {idx + 1}</p>
              <button
                onClick={() => removeVehicle(v.id)}
                className="text-xs text-slate-300 hover:text-red-400 transition"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Reg / Name</label>
                <input
                  value={v.reg}
                  onChange={(e) => updateVehicle(v.id, { reg: e.target.value })}
                  placeholder="MH01AA1234"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Type</label>
                <select
                  value={v.type}
                  onChange={(e) => updateVehicle(v.id, { type: e.target.value as typeof v.type })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-orange"
                >
                  {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Fuel</label>
                <select
                  value={v.fuelType}
                  onChange={(e) => updateVehicle(v.id, { fuelType: e.target.value as typeof v.fuelType })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-orange"
                >
                  {FUEL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Field
                id={`v-km-${v.id}`} label="Annual KM" unit="km"
                value={v.km} onChange={(val) => updateVehicle(v.id, { km: val })}
              />
            </div>
          </div>
        ))}

        <button
          id="btn-add-vehicle"
          onClick={addVehicle}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-semibold text-slate-400 hover:border-brand-orange hover:text-brand-orange transition"
        >
          <span className="text-lg leading-none">+</span> Add Vehicle
        </button>
      </div>
    </div>
  );
};
