/**
 * Scope 3 sections – employee commute, business travel, supply chain
 */
import { useCompanyInputStore } from '../../../store/companyInputStore';
import { BulkUploadBar } from './BulkUploadBar';

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
    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/15">
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

const SectionHeader = ({ title, desc, children }: { title: string; desc: string; children?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
        Scope 3 – Value Chain
      </span>
      <h2 className="mt-2 text-xl font-extrabold text-brand-ink">{title}</h2>
      <p className="mt-1 max-w-xl text-sm text-slate-500">{desc}</p>
    </div>
    {children && <div className="shrink-0 pt-1">{children}</div>}
  </div>
);

export const Scope3CommuteSection = () => {
  const { scope3, updateScope3, emissions } = useCompanyInputStore();

  const employees = parseFloat(scope3.employeeCount || '0');
  const km = parseFloat(scope3.avgCommuteKm || '0');
  const days = parseFloat(scope3.workDaysPerYear || '250');
  const commuteTonnes = employees * km * 2 * days * 0.00012;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Employee Commute"
        desc="Commuting is typically the largest Scope 3 category for service companies. Enter average commute data to estimate emissions."
      >
        <BulkUploadBar bulkType="employees" sampleFile="employee_template.xlsx" downloadName="bcx_employee_commute_template.xlsx" />
      </SectionHeader>

      {commuteTonnes > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <p className="text-sm font-semibold text-emerald-700">
            Employee commute generates{' '}
            <span className="text-xl font-extrabold">{commuteTonnes.toFixed(2)} tCO₂e</span>
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field
            id="s3-employees" label="Number of Employees" unit="people"
            value={scope3.employeeCount} onChange={(v) => updateScope3({ employeeCount: v })}
            hint="Total headcount covered by this calculation"
          />
          <Field
            id="s3-commute-km" label="Avg. One-Way Commute" unit="km"
            value={scope3.avgCommuteKm} onChange={(v) => updateScope3({ avgCommuteKm: v })}
            hint="Average single trip distance per employee"
          />
          <Field
            id="s3-work-days" label="Work Days / Year" unit="days"
            value={scope3.workDaysPerYear} onChange={(v) => updateScope3({ workDaysPerYear: v })}
            hint="Typically 250 days for a regular office schedule"
          />
        </div>

        {employees > 0 && km > 0 && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              <span className="font-bold text-brand-ink">{employees.toLocaleString('en-IN')}</span> employees ×{' '}
              <span className="font-bold text-brand-ink">{km} km</span> × 2 (return) ×{' '}
              <span className="font-bold text-brand-ink">{days} days</span> × 0.12 kg CO₂e/km =
            </p>
            <p className="mt-1 text-lg font-extrabold text-emerald-600">{commuteTonnes.toFixed(2)} tCO₂e</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-500">Scope 3 Total (all sources)</p>
        <p className="mt-1 text-3xl font-extrabold text-emerald-600">
          {emissions.scope3.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCO₂e
        </p>
      </div>
    </div>
  );
};

export const Scope3TravelSection = () => {
  const { scope3, updateScope3, emissions } = useCompanyInputStore();

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Business Travel"
        desc="Air travel emissions from employee business trips are a significant Scope 3 category."
      >
        <BulkUploadBar bulkType="employees" sampleFile="employee_template.xlsx" downloadName="bcx_business_travel_template.xlsx" />
      </SectionHeader>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field
          id="s3-air-km" label="Total Air Travel Distance" unit="km"
          value={scope3.airTravelKm} onChange={(v) => updateScope3({ airTravelKm: v })}
          hint="Sum of all flight distances by all employees for the year"
        />
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-500">Scope 3 Total</p>
        <p className="mt-1 text-3xl font-extrabold text-emerald-600">
          {emissions.scope3.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCO₂e
        </p>
      </div>
    </div>
  );
};

export const Scope3SupplySection = () => {
  const { scope3, updateScope3, emissions } = useCompanyInputStore();

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Supply Chain"
        desc="Spend-based estimation of upstream supply chain emissions using an average emissions intensity factor."
      >
        <BulkUploadBar bulkType="fuel" sampleFile="fuel_template.xlsx" downloadName="bcx_supply_chain_template.xlsx" />
      </SectionHeader>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <Field
          id="s3-supply" label="Total Procurement Spend" unit="₹ Lakh"
          value={scope3.supplyChainSpendLakh} onChange={(v) => updateScope3({ supplyChainSpendLakh: v })}
          hint="Annual procurement spend. Emissions estimated at 0.85 tCO₂e per ₹1 Lakh"
        />

        <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          <p>⚡ Spend-based methodology (IPCC Tier 1). For higher accuracy, use supplier-specific data.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-500">Scope 3 Total</p>
        <p className="mt-1 text-3xl font-extrabold text-emerald-600">
          {emissions.scope3.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCO₂e
        </p>
      </div>
    </div>
  );
};
