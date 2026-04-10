import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCompanyInputStore } from '../../store/companyInputStore';
import type { UserProfile } from '../../types';
import { cx } from '../../lib/utils';
import type { ReactNode } from 'react';

const YEARS = [2025, 2024, 2023, 2022];

interface SidebarItem {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
}

const NAV: SidebarItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'org', label: 'My Organization' },
  {
    id: 'activity-tracking', label: 'Activity-Based Carbon Tracking',
    children: [
      { id: 'scope1-fuel', label: 'Fuel Combustion' },
      { id: 'scope1-fleet', label: 'Fleet & Vehicles' },
      { id: 'scope2-elec', label: 'Electricity' },
      { id: 'scope2-heating', label: 'Heating & Cooling' },
      { id: 'scope3-commute', label: 'Employee Commute' },
      { id: 'scope3-travel', label: 'Business Travel' },
      { id: 'scope3-supply', label: 'Supply Chain' },
    ]
  },
  { id: 'footprint-calculator', label: 'Carbon Footprint Calculator' },
  { id: 'ai-recommendations', label: 'AI-Based Recommendation System' },
  { id: 'visualization', label: 'Visualization Dashboard' },
  { id: 'institutional-analytics', label: 'Institutional Analytics Panel' },
];

interface CompanyLayoutProps {
  profile: UserProfile;
  activeSection: string;
  onNav: (id: string) => void;
  children: ReactNode;
}

export const CompanyLayout = ({ profile, activeSection, onNav, children }: CompanyLayoutProps) => {
  const signOut = useAuthStore((s) => s.signOut);
  const { reportingYear, setReportingYear, emissions } = useCompanyInputStore();
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) =>
    setSidebarCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const fmtTonnes = (t: number) =>
    t === 0 ? '-- tCO₂e' : `${t.toLocaleString('en-IN', { maximumFractionDigits: 1 })} tCO₂e`;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="flex h-full w-52 shrink-0 flex-col border-r border-slate-200 bg-white">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-4">
          <button
            onClick={() => onNav('home')}
            className="flex items-center gap-2"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-orange text-xs font-extrabold text-white">
              BC
            </span>
          </button>
          <div>
            <p className="text-xs font-extrabold tracking-tight text-brand-ink leading-none">BCX</p>
            <p className="text-[10px] text-slate-400">Carbon Exchange</p>
          </div>
        </div>

        {/* Measure / Report tabs */}
        <div className="flex gap-1 border-b border-slate-100 p-2">
          <button className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-semibold text-brand-ink">
            Measure
          </button>
          <button className="flex-1 rounded-lg py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
            Report
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => {
            const isParentActive =
              activeSection === item.id ||
              item.children?.some((c) => c.id === activeSection);
            const isOpen = !sidebarCollapsed[item.id];

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.children) {
                      toggleCollapse(item.id);
                    } else {
                      onNav(item.id);
                    }
                  }}
                  className={cx(
                    'flex w-full items-center justify-between px-4 py-2 text-sm transition',
                    isParentActive
                      ? 'font-semibold text-brand-orange'
                      : 'font-medium text-slate-600 hover:text-brand-ink'
                  )}
                >
                  <span>{item.label}</span>
                  {item.children && (
                    <svg
                      viewBox="0 0 10 6"
                      className={cx('h-2.5 w-2.5 transition-transform', isOpen ? 'rotate-180' : '')}
                      fill="none"
                    >
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                {item.children && isOpen && (
                  <div className="ml-4 border-l border-slate-100 pl-3">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onNav(child.id)}
                        className={cx(
                          'block w-full py-1.5 text-left text-xs transition',
                          activeSection === child.id
                            ? 'font-semibold text-brand-orange'
                            : 'font-medium text-slate-500 hover:text-brand-ink'
                        )}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom footer */}
        <div className="border-t border-slate-100 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
            <div className={cx('h-2 w-2 rounded-full', emissions.total > 0 ? 'bg-emerald-400' : 'bg-slate-300')} />
            <span className="text-[10px] font-medium text-slate-500">
              {emissions.total === 0
                ? '0% of footprint measured'
                : `${Math.min(100, Math.round((emissions.total / 200) * 100))}% footprint captured`}
            </span>
          </div>
          <button className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition">
            Buy Upgrades
          </button>
          <div className="flex gap-2 pt-1">
            <button className="flex-1 text-[10px] text-slate-400 hover:text-brand-ink transition">Help Center</button>
            <button
              onClick={() => void signOut()}
              className="flex-1 text-[10px] text-slate-400 hover:text-red-500 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-slate-200 bg-white px-5">
          {/* Live total */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="text-[10px] font-bold text-slate-400">--</span>
            <span className={cx(
              'text-xs font-bold',
              emissions.total > 0 ? 'text-brand-orange' : 'text-slate-400'
            )}>
              {fmtTonnes(emissions.total)}
            </span>
          </div>

          {/* Reporting Year */}
          <div className="relative">
            <button
              id="btn-reporting-year"
              onClick={() => setShowYearMenu((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink hover:border-slate-300 transition"
            >
              Reporting Year: {reportingYear}
              <svg viewBox="0 0 10 6" fill="none" className="h-2.5 w-2.5 text-slate-400">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {showYearMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[130px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => { setReportingYear(y); setShowYearMenu(false); }}
                    className={cx(
                      'block w-full px-4 py-2 text-left text-xs transition',
                      y === reportingYear ? 'font-bold text-brand-orange' : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Copilot */}
          <button className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition">
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Copilot
          </button>

          {/* Avatar */}
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-orange text-xs font-bold text-white">
            {(profile.name ?? 'C').slice(0, 1).toUpperCase()}
          </span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {/* Climate profile hero */}
          <section
            className="relative overflow-hidden px-8 pb-6 pt-8"
            style={{
              background:
                'linear-gradient(135deg, #fff9f5 0%, #fef3e8 40%, #f0fdf4 100%)'
            }}
          >
            {/* Decorative grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)',
                backgroundSize: '32px 32px'
              }}
            />

            <div className="relative flex flex-col gap-4 pr-72">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Climate Profile
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-brand-ink">
                {profile.company ?? profile.name}
              </h1>

              <div className="h-px bg-slate-200" />

              <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-slate-400">
                    <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5 3V2M11 3V2M2 7h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  {profile.industry ?? 'Industry not set'}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-slate-400">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M2 8h12M8 2c-2 3-2 9 0 12M8 2c2 3 2 9 0 12" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  {profile.location ?? 'India'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => onNav('home')}
                  className={cx(
                    'rounded-lg border px-4 py-2 text-sm font-semibold transition',
                    activeSection === 'home'
                      ? 'border-brand-orange bg-white text-brand-orange shadow-sm'
                      : 'border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300'
                  )}
                >
                  Home
                </button>
                <button className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 transition">
                  Share Footprint
                </button>
                <button className="ml-auto rounded-lg border border-slate-200 bg-white/80 p-2 text-slate-400 hover:text-slate-600 transition">
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M5.05 14.95l1.41-1.41M13.54 6.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Live emissions badge – absolute right */}
            <div className="absolute right-8 top-8">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur min-w-[220px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {reportingYear} Total Calculated Emissions
                </p>
                <p className={cx(
                  'mt-2 text-2xl font-extrabold tracking-tight',
                  emissions.total > 0 ? 'text-brand-orange' : 'text-slate-400'
                )}>
                  {emissions.total > 0
                    ? `${emissions.total.toLocaleString('en-IN', { maximumFractionDigits: 1 })} tCO₂e`
                    : '-- tCO₂e'}
                </p>
                {emissions.total > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                    {(
                      [
                        { key: 'scope1', label: 'Scope 1', color: 'bg-orange-400' },
                        { key: 'scope2', label: 'Scope 2', color: 'bg-blue-400' },
                        { key: 'scope3', label: 'Scope 3', color: 'bg-emerald-400' },
                      ] as const
                    ).map(({ key, label, color }) => (
                      <div key={key} className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={cx('h-2 w-2 rounded-full flex-shrink-0', color)} />
                        <span>{label}</span>
                        <span className="ml-auto font-semibold text-brand-ink">
                          {emissions[key].toLocaleString('en-IN', { maximumFractionDigits: 1 })} t
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {emissions.total === 0 && (
                  <p className="mt-2 text-xs text-slate-400">
                    Enter data in the sections below to see live calculations.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Section content */}
          <div className="px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
