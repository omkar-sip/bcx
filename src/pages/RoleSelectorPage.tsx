import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cx } from '../lib/utils';
import type { Role } from '../types';

const roles: Array<{
  role: Role;
  label: string;
  tagline: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
  ring: string;
  icon: React.ReactNode;
}> = [
  {
    role: 'employee',
    label: 'Employee',
    tagline: 'Score Builder',
    desc: 'Log eco-actions, build your sustainability score, compete on leaderboards.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    ring: 'ring-blue-500/20',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
        <circle cx="22" cy="22" r="22" fill="currentColor" opacity="0.12" />
        <circle cx="22" cy="17" r="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 34c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 20l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    role: 'company',
    label: 'Company',
    tagline: 'Credit Buyer',
    desc: 'Track team sustainability, purchase verified carbon credits, offset emissions.',
    color: 'text-brand-orange',
    bg: 'bg-brand-sand',
    border: 'border-brand-orange',
    ring: 'ring-brand-orange/20',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
        <circle cx="22" cy="22" r="22" fill="currentColor" opacity="0.12" />
        <path d="M8 34V18l14-8 14 8v16H8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <rect x="18" y="24" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="11" y="22" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="28" y="22" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    role: 'farmer',
    label: 'Farmer',
    tagline: 'Credit Seller',
    desc: 'Convert sustainable farming into verified carbon credits and earn real income.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-500',
    ring: 'ring-emerald-500/20',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
        <circle cx="22" cy="22" r="22" fill="currentColor" opacity="0.12" />
        <path d="M22 36V22M22 22C22 22 14 18 14 10c4 0 7 2 8 5 1-3 4-5 8-5 0 8-8 12-8 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 34h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
];

export const RoleSelectorPage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Role | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    sessionStorage.setItem('bcx_selected_role', selected);
    navigate('/auth');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-mist">
      {/* Gradient decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(241,90,34,0.07),transparent_40%),radial-gradient(circle_at_85%_75%,rgba(22,163,74,0.06),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-5 py-10">

        {/* Header */}
        <div className="mb-2">
          <div className="mb-6 inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M10 2C10 2 5 7 5 11a5 5 0 0010 0c0-4-5-9-5-9z" />
              </svg>
            </span>
            <span className="text-sm font-bold tracking-wider text-brand-ink">BCX</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-orange">
            Get Started
          </p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-brand-ink">
            Who are you on<br />BCX?
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Choose your role to personalise your experience.
          </p>
        </div>

        {/* Role Cards */}
        <div className="mt-6 space-y-4">
          {roles.map((r) => {
            const isActive = selected === r.role;
            return (
              <button
                key={r.role}
                id={`role-${r.role}`}
                type="button"
                onClick={() => setSelected(r.role)}
                className={cx(
                  'group relative flex w-full items-center gap-5 rounded-2xl border-2 bg-white p-5 text-left shadow-soft transition-all duration-200',
                  isActive
                    ? `${r.border} ring-4 ${r.ring} shadow-float`
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-soft'
                )}
              >
                {/* Icon */}
                <div
                  className={cx(
                    'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-200',
                    r.color,
                    isActive ? r.bg : 'bg-slate-50 group-hover:' + r.bg
                  )}
                >
                  {r.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-brand-ink">{r.label}</h2>
                    <span
                      className={cx(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                        isActive ? `${r.bg} ${r.color}` : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {r.tagline}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-snug text-slate-500">{r.desc}</p>
                </div>

                {/* Check */}
                <div
                  className={cx(
                    'ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
                    isActive ? `${r.border} bg-brand-orange text-white border-brand-orange` : 'border-slate-300'
                  )}
                >
                  {isActive && (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8">
          <button
            id="btn-continue-role"
            type="button"
            disabled={!selected}
            onClick={handleContinue}
            className={cx(
              'btn-primary w-full py-4 text-base transition-all duration-300',
              !selected && 'opacity-40 pointer-events-none'
            )}
          >
            Continue as {selected ? roles.find(r => r.role === selected)?.label : '…'}
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">
            You can switch roles later from your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
};
