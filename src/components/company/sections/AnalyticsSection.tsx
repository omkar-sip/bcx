/**
 * AnalyticsSection – summary of all calculated emissions with charts and breakdown
 */
import { useCompanyInputStore } from '../../../store/companyInputStore';

interface BarProps { label: string; value: number; total: number; color: string; }

const Bar = ({ label, value, total, color }: BarProps) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-brand-ink">
          {value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCO₂e
          <span className="ml-1 text-slate-400 font-normal">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const TrendBar = ({ year, s1, s2, s3, isTarget, maxVal }: { year: string, s1: number, s2: number, s3: number, isTarget: boolean, maxVal: number }) => {
  const total = s1 + s2 + s3;
  const p1 = maxVal > 0 ? (s1 / maxVal) * 100 : 0;
  const p2 = maxVal > 0 ? (s2 / maxVal) * 100 : 0;
  const p3 = maxVal > 0 ? (s3 / maxVal) * 100 : 0;
  
  return (
    <div className="flex flex-col items-center justify-end gap-2 group relative">
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition whitespace-nowrap bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none z-10">
        {year}: {total.toFixed(0)} tCO₂e
      </div>
      <div className="w-12 flex flex-col justify-end bg-slate-50 rounded-t border-b border-slate-200 h-40 overflow-hidden relative">
        <div className="w-full bg-emerald-400 transition-all duration-500" style={{ height: `${p3}%` }} />
        <div className="w-full bg-blue-400 transition-all duration-500" style={{ height: `${p2}%` }} />
        <div className="w-full bg-orange-400 transition-all duration-500" style={{ height: `${p1}%` }} />
        {isTarget && (
          <div className="absolute top-0 w-full border-t border-dashed border-slate-400" style={{ height: '70%' }} />
        )}
      </div>
      <span className={`text-xs font-semibold ${isTarget ? 'text-brand-orange' : 'text-slate-500'}`}>{year}</span>
    </div>
  );
};

export const AnalyticsSection = ({ showCharts = false }: { showCharts?: boolean }) => {
  const { emissions, reportingYear, scope1, scope2, scope3, locations, vehicles, bulkImports } = useCompanyInputStore();

  const isEmpty = emissions.total === 0;
  const importedVehicleTonnes = bulkImports.vehicles.reduce((sum, row) => sum + row.estimatedEmissionsTonnes, 0);
  const importedFuelTonnes = bulkImports.fuel.reduce((sum, row) => sum + row.annualEmissionsTonnes, 0);
  const importedLocationTonnes = bulkImports.locations.reduce((sum, row) => sum + row.estimatedEmissionsTonnes, 0);
  const importedEmployeeTonnes = bulkImports.employees.reduce((sum, row) => sum + row.annualEmissionsTonnes, 0);

  const breakdown = [
    { label: 'Scope 1 – Direct Emissions', value: emissions.scope1, color: 'bg-orange-400' },
    { label: 'Scope 2 – Electricity & Heat', value: emissions.scope2, color: 'bg-blue-400' },
    { label: 'Scope 3 – Value Chain', value: emissions.scope3, color: 'bg-emerald-400' },
  ];

  const scope1Details = [
    { label: 'Fuel Combustion', value: parseFloat(scope1.fuelLitres || '0') * 0.00268 },
    { label: 'LPG', value: parseFloat(scope1.lpgKg || '0') * 0.00296 },
    { label: 'Generator', value: parseFloat(scope1.generatorLitres || '0') * 0.00268 },
    { label: 'Uploaded fuel logs', value: importedFuelTonnes },
    { label: 'Fleet Vehicles', value: importedVehicleTonnes || vehicles.filter(v => v.fuelType !== 'electric').length * 0.5 },
  ].filter(d => d.value > 0);

  const scope2GridTonnes =
    importedLocationTonnes ||
    parseFloat(scope2.electricityKwh || '0') *
      (1 - Math.min(1, parseFloat(scope2.renewablePercent || '0') / 100)) *
      0.000708;

  const scope3Details = [
    { label: 'Employee Commute', value: importedEmployeeTonnes || parseFloat(scope3.employeeCount || '0') * parseFloat(scope3.avgCommuteKm || '0') * 2 * parseFloat(scope3.workDaysPerYear || '250') * 0.00012 },
    { label: 'Business Air Travel', value: parseFloat(scope3.airTravelKm || '0') * 0.000115 },
    { label: 'Supply Chain', value: parseFloat(scope3.supplyChainSpendLakh || '0') * 0.85 },
  ].filter(d => d.value > 0);

  const topImportedContributors = [
    ...bulkImports.fuel.map((row) => ({ label: row.assetName, scope: 'Scope 1', tonnes: row.annualEmissionsTonnes })),
    ...bulkImports.vehicles.map((row) => ({ label: row.label, scope: 'Scope 1', tonnes: row.estimatedEmissionsTonnes })),
    ...bulkImports.locations.map((row) => ({ label: row.label, scope: 'Scope 2', tonnes: row.estimatedEmissionsTonnes })),
    ...bulkImports.employees.map((row) => ({ label: row.name, scope: 'Scope 3', tonnes: row.annualEmissionsTonnes })),
  ]
    .filter((row) => row.tonnes > 0)
    .sort((left, right) => right.tonnes - left.tonnes)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
          showCharts ? 'bg-purple-100 text-purple-600' : 'bg-sky-100 text-sky-600'
        }`}>
          {showCharts ? 'Module 4' : 'Module 2'}
        </span>
        <h2 className="mt-2 text-xl font-extrabold text-brand-ink">
          {showCharts ? 'Visualization Dashboard' : 'Carbon Footprint Calculator'}
        </h2>
        <p className="mt-1 max-w-xl text-sm text-slate-500">
          {showCharts
            ? 'Emission statistics and trends — visualized from your live data inputs.'
            : `Complete breakdown of your ${reportingYear} GHG footprint, estimated using predefined emission models.`
          }
        </p>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <svg viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 h-12 w-12 text-slate-200">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
            <path d="M16 32c0-8 4-12 8-12s8 4 8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="18" r="4" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p className="text-slate-400 text-sm font-medium">No data yet</p>
          <p className="text-slate-300 text-xs mt-1">Enter emissions data in Scope 1, 2, or 3 sections to see analytics.</p>
        </div>
      ) : (
        <>
          {/* Total banner */}
          <div className="rounded-2xl bg-gradient-to-r from-brand-orange to-brand-ember p-6 text-white shadow-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">{reportingYear} Total Emissions</p>
            <p className="mt-2 text-5xl font-extrabold tracking-tight">
              {emissions.total.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              <span className="text-2xl font-semibold opacity-80 ml-2">tCO₂e</span>
            </p>
            <p className="mt-2 text-sm opacity-70">Gross, market-based, calculated from user inputs</p>
          </div>

          {/* Visualization Trend Chart */}
          {showCharts && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-bold text-brand-ink">Emissions Trajectory</p>
                  <p className="text-xs text-slate-500 mt-1">Modeled multi-year reduction trend</p>
                </div>
                <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" /> S1</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> S2</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> S3</span>
                </div>
              </div>
              <div className="flex items-end justify-between px-4 pb-2 border-b border-slate-100">
                <TrendBar year="2022" s1={emissions.scope1 * 1.3} s2={emissions.scope2 * 1.5} s3={emissions.scope3 * 1.2} isTarget={false} maxVal={emissions.total * 1.8} />
                <TrendBar year="2023" s1={emissions.scope1 * 1.2} s2={emissions.scope2 * 1.3} s3={emissions.scope3 * 1.15} isTarget={false} maxVal={emissions.total * 1.8} />
                <TrendBar year="2024" s1={emissions.scope1 * 1.1} s2={emissions.scope2 * 1.1} s3={emissions.scope3 * 1.05} isTarget={false} maxVal={emissions.total * 1.8} />
                <TrendBar year="2025" s1={emissions.scope1} s2={emissions.scope2} s3={emissions.scope3} isTarget={false} maxVal={emissions.total * 1.8} />
                <TrendBar year="2030 (Target)" s1={emissions.scope1 * 0.4} s2={emissions.scope2 * 0.1} s3={emissions.scope3 * 0.6} isTarget={true} maxVal={emissions.total * 1.8} />
              </div>
            </div>
          )}

          {/* Scope breakdown bars */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <p className="text-sm font-bold text-brand-ink">Scope Breakdown</p>
            {breakdown.map((b) => (
              <Bar key={b.label} {...b} total={emissions.total} />
            ))}
          </div>

          {/* Scope detail tables */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Scope 1 */}
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-500">Scope 1</p>
                <span className="h-2 w-2 rounded-full bg-orange-400" />
              </div>
              <p className="text-2xl font-extrabold text-orange-600">
                {emissions.scope1.toLocaleString('en-IN', { maximumFractionDigits: 1 })} t
              </p>
              {scope1Details.length > 0 ? (
                <div className="space-y-1 pt-2 border-t border-orange-100">
                  {scope1Details.map((d) => (
                    <div key={d.label} className="flex justify-between text-xs">
                      <span className="text-orange-700">{d.label}</span>
                      <span className="font-semibold text-orange-800">{d.value.toFixed(2)} t</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-orange-400">No Scope 1 sources added</p>
              )}
            </div>

            {/* Scope 2 */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-500">Scope 2</p>
                <span className="h-2 w-2 rounded-full bg-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-blue-600">
                {emissions.scope2.toLocaleString('en-IN', { maximumFractionDigits: 1 })} t
              </p>
              <div className="space-y-1 pt-2 border-t border-blue-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-700">Grid electricity</span>
                  <span className="font-semibold text-blue-800">
                    {scope2GridTonnes > 0
                      ? scope2GridTonnes.toFixed(2)
                      : '--'} t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Imported electricity rows</span>
                  <span className="font-semibold text-blue-800">{bulkImports.locations.length || locations.length} rows</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Locations (shared grid)</span>
                  <span className="font-semibold text-blue-800">{locations.length} sites</span>
                </div>
              </div>
            </div>

            {/* Scope 3 */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-500">Scope 3</p>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600">
                {emissions.scope3.toLocaleString('en-IN', { maximumFractionDigits: 1 })} t
              </p>
              {scope3Details.length > 0 ? (
                <div className="space-y-1 pt-2 border-t border-emerald-100">
                  {scope3Details.map((d) => (
                    <div key={d.label} className="flex justify-between text-xs">
                      <span className="text-emerald-700">{d.label}</span>
                      <span className="font-semibold text-emerald-800">{d.value.toFixed(2)} t</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400">No Scope 3 sources added</p>
              )}
            </div>
          </div>

          {topImportedContributors.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-ink">Imported Sheet Hotspots</p>
                  <p className="text-xs text-slate-400 mt-1">Top contributors scraped directly from uploaded rows</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {topImportedContributors.length} tracked
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {topImportedContributors.map((row) => (
                  <div key={`${row.scope}-${row.label}`} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-brand-ink">{row.label}</p>
                      <p className="text-xs text-slate-400">{row.scope}</p>
                    </div>
                    <p className="text-sm font-bold text-brand-orange">
                      {row.tonnes.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCOâ‚‚e
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insight footer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 mb-3">Key Insights</p>
            <ul className="space-y-2 text-sm text-slate-600">
              {emissions.scope2 > emissions.scope1 && emissions.scope2 > emissions.scope3 && (
                <li className="flex gap-2">
                  <span className="text-blue-500">⚡</span>
                  Scope 2 is your largest source. Consider increasing renewable energy procurement.
                </li>
              )}
              {emissions.scope1 > emissions.scope2 && emissions.scope1 > emissions.scope3 && (
                <li className="flex gap-2">
                  <span className="text-orange-500">🔥</span>
                  Scope 1 dominates. Fleet electrification or fuel switching will have the highest impact.
                </li>
              )}
              {emissions.scope3 > emissions.scope1 && emissions.scope3 > emissions.scope2 && (
                <li className="flex gap-2">
                  <span className="text-emerald-500">🔗</span>
                  Scope 3 is the largest category. Focus on supply chain engagement and commute policies.
                </li>
              )}
              {parseFloat(scope2.renewablePercent || '0') < 20 && parseFloat(scope2.electricityKwh || '0') > 0 && (
                <li className="flex gap-2">
                  <span className="text-violet-500">🌱</span>
                  You have only {parseFloat(scope2.renewablePercent || '0')}% renewable electricity. Increasing this is the cheapest Scope 2 lever.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
