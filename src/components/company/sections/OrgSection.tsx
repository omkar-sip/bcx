/**
 * OrgSection – My Organization data setup
 */
import { useCompanyInputStore } from '../../../store/companyInputStore';

const INDUSTRIES = [
  'Manufacturing', 'Information Technology', 'Healthcare', 'Financial Services',
  'Retail', 'Education', 'Transportation & Logistics', 'Agriculture',
  'Real Estate', 'Hospitality', 'Energy & Utilities', 'Other'
];

export const OrgSection = () => {
  const { industry, setIndustry, country, setCountry, locations, addLocation, updateLocation, removeLocation, validateLocationCity } =
    useCompanyInputStore();

  const LOCATION_TYPES = ['office', 'factory', 'warehouse'] as const;

  return (
    <div className="space-y-8">
      <div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Organization
        </span>
        <h2 className="mt-2 text-xl font-extrabold text-brand-ink">My Organization</h2>
        <p className="mt-1 max-w-xl text-sm text-slate-500">
          Set your organization context. Industry and country affect emission factor lookups.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="org-industry" className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Industry
            </label>
            <select
              id="org-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="org-country" className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Country / Region
            </label>
            <select
              id="org-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
            >
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="EU">EU</option>
              <option value="UK">UK</option>
            </select>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div>
        <h3 className="text-base font-bold text-brand-ink mb-1">Locations</h3>
        <p className="text-sm text-slate-500 mb-4">
          Add each physical site. Electricity and fuel data per location improves granularity.
        </p>

        <div className="space-y-3">
          {locations.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
              <p className="text-slate-400 text-sm">No locations added yet.</p>
            </div>
          )}

          {locations.map((loc, idx) => (
            <div key={loc.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">Location {idx + 1}</p>
                <button onClick={() => removeLocation(loc.id)} className="text-xs text-slate-300 hover:text-red-400 transition">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Name</label>
                  <input
                    value={loc.name}
                    onChange={(e) => updateLocation(loc.id, { name: e.target.value })}
                    placeholder="HQ / Branch"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">City</label>
                    {loc.isValid === 'invalid' && <span className="text-[10px] text-red-500 font-semibold">Not found</span>}
                  </div>
                  <div className="relative">
                    <input
                      value={loc.city}
                      onChange={(e) => updateLocation(loc.id, { city: e.target.value, isValid: 'idle' })}
                      onBlur={() => validateLocationCity(loc.id, loc.city)}
                      placeholder="Mumbai"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 pr-8"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      {loc.isValid === 'validating' && <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-orange"></span>}
                      {loc.isValid === 'valid' && <span className="text-emerald-500 font-bold" title="City Validated">✓</span>}
                      {loc.isValid === 'invalid' && <span className="text-red-500 font-bold" title="Place not found">✗</span>}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Type</label>
                  <select
                    value={loc.type}
                    onChange={(e) => updateLocation(loc.id, { type: e.target.value as typeof loc.type })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-orange"
                  >
                    {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Electricity kWh</label>
                  <input
                    type="number" min="0"
                    value={loc.electricityKwh}
                    onChange={(e) => updateLocation(loc.id, { electricityKwh: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            id="btn-add-location"
            onClick={addLocation}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-semibold text-slate-400 hover:border-brand-orange hover:text-brand-orange transition"
          >
            <span className="text-lg leading-none">+</span> Add Location
          </button>
        </div>
      </div>
    </div>
  );
};
