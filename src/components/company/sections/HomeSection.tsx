/**
 * HomeSection – landing view inside the company dashboard.
 * Shows onboarding cards when nothing is filled in, and a summary once data exists.
 */
import { useRef } from 'react';
import { useCompanyInputStore } from '../../../store/companyInputStore';
import { useToast } from '../../../hooks/useToast';
import { parseBulkExcel, mapExcelToStore } from '../../../lib/bulkParser';
import { cx, downloadResource } from '../../../lib/utils';

interface HomeSectionProps {
  onNav: (id: string) => void;
}

interface StartCardProps {
  title: string;
  desc: string;
  onClick: () => void;
  scope: string;
  icon: React.ReactNode;
  bulkType: 'vehicles' | 'locations' | 'employees' | 'fuel';
  sampleFile?: string;
  downloadName?: string;
}

const StartCard = ({
  title,
  desc,
  onClick,
  scope,
  icon,
  bulkType,
  sampleFile,
  downloadName,
}: StartCardProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { pushToast } = useToast();
  const loadBulkData = useCompanyInputStore(s => s.loadBulkData);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        pushToast(`Parsing ${file.name}...`, 'info');
        const parsed = await parseBulkExcel(file, bulkType);
        const mapped = mapExcelToStore(parsed.type, parsed.data);
        
        if (mapped.length > 0) {
          loadBulkData(parsed.type, mapped);
          pushToast(`Successfully uploaded ${mapped.length} items to ${parsed.type}.`, 'success');
        } else {
          pushToast("No valid data found in file.", "error");
        }
      } catch (err) {
        console.error(err);
        pushToast("Failed to parse Excel file. Ensure it is a valid .xlsx or .csv", "error");
      }
      e.target.value = '';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col" onClick={onClick}>
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition"
      >
        ×
      </button>
      <div className="mb-4 flex items-start justify-between pr-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-1">{scope}</p>
          <h3 className="text-base font-bold text-brand-ink group-hover:text-brand-orange transition-colors">{title}</h3>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-500 mb-6 flex-1">{desc}</p>
      
      <div className="flex items-end justify-between border-t border-slate-50 pt-4 mt-auto gap-4">
        <div className="flex flex-col gap-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-ember transition w-fit shadow-sm"
          >
            Add Data Manually
          </button>
          
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" className="hidden" ref={fileRef} onChange={handleFile} accept=".csv,.xlsx,.xls" onClick={e => e.stopPropagation()} />
            <button
               onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
               className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1 shadow-sm"
             >
               <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3"><path d="M8 1v10M4 5l4-4 4 4M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
               Bulk Upload
            </button>
            {sampleFile && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await downloadResource(`/home_data_sample/${sampleFile}`, downloadName || sampleFile);
                    pushToast(`Download started: ${downloadName || sampleFile}`, 'success');
                  } catch (err) {
                    pushToast('Failed to download sample file.', 'error');
                  }
                }}
                className="rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1.5 text-[10px] font-bold text-brand-orange hover:bg-orange-100 transition flex items-center gap-1 shadow-sm"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3"><path d="M8 11V1M4 7l4 4 4-4M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Sample File
              </button>
            )}
          </div>
        </div>
        <div className="text-slate-200 shrink-0">{icon}</div>
      </div>
    </div>
  );
};

const ScopeDonut = ({ s1, s2, s3, total }: { s1: number; s2: number; s3: number; total: number }) => {
  const size = 80;
  const cx_center = size / 2;
  const r = 30;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * r;

  const pct1 = total > 0 ? s1 / total : 0;
  const pct2 = total > 0 ? s2 / total : 0;

  const dash1 = pct1 * circumference;
  const dash2 = pct2 * circumference;
  const dash3 = (1 - pct1 - pct2) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={cx_center} cy={cx_center} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      {total > 0 && (
        <>
          <circle
            cx={cx_center} cy={cx_center} r={r} fill="none"
            stroke="#fb923c" strokeWidth={strokeWidth}
            strokeDasharray={`${dash1} ${circumference - dash1}`}
            strokeLinecap="butt"
          />
          <circle
            cx={cx_center} cy={cx_center} r={r} fill="none"
            stroke="#60a5fa" strokeWidth={strokeWidth}
            strokeDasharray={`${dash2} ${circumference - dash2}`}
            strokeDashoffset={-dash1}
            strokeLinecap="butt"
          />
          <circle
            cx={cx_center} cy={cx_center} r={r} fill="none"
            stroke="#34d399" strokeWidth={strokeWidth}
            strokeDasharray={`${dash3} ${circumference - dash3}`}
            strokeDashoffset={-(dash1 + dash2)}
            strokeLinecap="butt"
          />
        </>
      )}
    </svg>
  );
};

export const HomeSection = ({ onNav }: HomeSectionProps) => {
  const { emissions, locations, vehicles, scope1, scope2, scope3 } = useCompanyInputStore();

  const hasAnyData =
    emissions.total > 0 || locations.length > 0 || vehicles.length > 0;

  const CARDS = [
    {
      id: 'scope1-fleet',
      title: 'Add Vehicles',
      bulkType: 'vehicles' as const,
      scope: 'Scope 1 – Direct',
      desc: 'Vehicles form the backbone of your scope 1 (direct emissions) footprint.',
      sampleFile: 'vehicle_template.xlsx',
      downloadName: 'bcx_vehicle_template.xlsx',
      icon: (
        <svg viewBox="0 0 80 50" fill="none" className="h-14 w-20 opacity-40">
          <rect x="10" y="20" width="60" height="20" rx="5" fill="#94a3b8" />
          <circle cx="22" cy="40" r="7" fill="#64748b" />
          <circle cx="58" cy="40" r="7" fill="#64748b" />
          <rect x="40" y="10" width="28" height="12" rx="3" fill="#cbd5e1" />
          <path d="M10 24l5-8h25l5 8" stroke="#94a3b8" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'scope2-elec',
      title: 'Add Locations',
      bulkType: 'locations' as const,
      scope: 'Scope 2 – Indirect',
      desc: 'Locations will be instrumental in building your scope 2 (indirect emissions) footprint.',
      sampleFile: 'location_template.xlsx',
      downloadName: 'bcx_locations_template.xlsx',
      icon: (
        <svg viewBox="0 0 80 60" fill="none" className="h-14 w-20 opacity-40">
          <rect x="15" y="20" width="50" height="35" rx="3" fill="#94a3b8" />
          <rect x="25" y="10" width="30" height="12" rx="2" fill="#cbd5e1" />
          <rect x="30" y="38" width="8" height="12" fill="#64748b" />
          <rect x="42" y="38" width="8" height="12" fill="#64748b" />
          <rect x="20" y="28" width="10" height="8" rx="1" fill="#e2e8f0" />
          <rect x="35" y="28" width="10" height="8" rx="1" fill="#e2e8f0" />
          <rect x="50" y="28" width="10" height="8" rx="1" fill="#e2e8f0" />
        </svg>
      ),
    },
    {
      id: 'scope3-commute',
      title: 'Add Employees',
      bulkType: 'employees' as const,
      scope: 'Scope 3 – Value Chain',
      desc: 'Employee commute data drives your scope 3 footprint for people-related emissions.',
      sampleFile: 'employee_template.xlsx',
      downloadName: 'bcx_employee_commute_template.xlsx',
      icon: (
        <svg viewBox="0 0 80 60" fill="none" className="h-14 w-20 opacity-40">
          <circle cx="30" cy="20" r="10" fill="#cbd5e1" />
          <circle cx="52" cy="22" r="8" fill="#94a3b8" />
          <path d="M10 50c0-12 10-18 20-18s20 6 20 18" fill="#e2e8f0" />
          <path d="M38 50c0-10 6-14 14-14s14 4 14 14" fill="#cbd5e1" />
        </svg>
      ),
    },
    {
      id: 'scope1-fuel',
      title: 'Log Fuel Use',
      bulkType: 'fuel' as const,
      scope: 'Scope 1 – Stationary',
      desc: 'Fuel combustion from boilers, generators, and industrial processes.',
      sampleFile: 'fuel_template.xlsx',
      downloadName: 'bcx_fuel_combustion_template.xlsx',
      icon: (
        <svg viewBox="0 0 60 60" fill="none" className="h-14 w-20 opacity-40">
          <rect x="15" y="30" width="30" height="20" rx="4" fill="#94a3b8" />
          <rect x="25" y="10" width="10" height="22" rx="3" fill="#cbd5e1" />
          <path d="M28 10c0 0-6-4 0-10 0 0-4 4 2 6 0 0-6 0-2 4z" fill="#fb923c" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Summary row – only when data exists */}
      {hasAnyData && (
        <div className="grid grid-cols-3 gap-4">
          {/* Donut summary */}
          <div className="col-span-1 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ScopeDonut s1={emissions.scope1} s2={emissions.scope2} s3={emissions.scope3} total={emissions.total} />
            <div className="space-y-2">
              {[
                { label: 'Scope 1', value: emissions.scope1, color: 'bg-orange-400' },
                { label: 'Scope 2', value: emissions.scope2, color: 'bg-blue-400' },
                { label: 'Scope 3', value: emissions.scope3, color: 'bg-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className={cx('h-2 w-2 rounded-full flex-shrink-0', color)} />
                  <span className="text-slate-500">{label}</span>
                  <span className="ml-auto font-bold text-brand-ink">
                    {value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} t
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="col-span-2 grid grid-cols-3 gap-4">
            {[
              {
                label: 'Total emissions',
                value: `${emissions.total.toLocaleString('en-IN', { maximumFractionDigits: 1 })} tCO₂e`,
                sub: 'Gross calculated',
                accent: 'text-brand-orange',
              },
              {
                label: 'Locations logged',
                value: String(locations.length),
                sub: 'Active in this period',
                accent: 'text-blue-500',
              },
              {
                label: 'Vehicles tracked',
                value: String(vehicles.length),
                sub: 'Fleet entries',
                accent: 'text-emerald-500',
              },
            ].map(({ label, value, sub, accent }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                <p className={cx('mt-2 text-2xl font-extrabold', accent)}>{value}</p>
                <p className="mt-1 text-xs text-slate-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Get Started heading */}
      <div>
        <h2 className="text-2xl font-extrabold text-brand-ink">
          {hasAnyData ? 'Continue Building Your Footprint' : "Let's Get Started"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {hasAnyData
            ? 'Add more data sources to improve accuracy of your emissions calculations.'
            : 'Add your first data source to start calculating your carbon footprint in real time.'}
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <StartCard
            key={card.id}
            title={card.title}
            scope={card.scope}
            desc={card.desc}
            icon={card.icon}
            bulkType={card.bulkType}
            sampleFile={card.sampleFile}
            downloadName={card.downloadName}
            onClick={() => onNav(card.id)}
          />
        ))}
      </div>
    </div>
  );
};
