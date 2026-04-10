import { useState } from 'react';
import { cx } from '../../lib/utils';

interface LoginFormProps {
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
  onSwitch: () => void;
  loading: boolean;
}

const DEMO_ACCOUNTS = [
  {
    role: 'employee' as const,
    label: 'Employee',
    email: 'employee@bcx.io',
    desc: 'Log eco-actions, build your sustainability score and climb leaderboards.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    gradient: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    borderActive: 'border-blue-500 ring-blue-500/20',
    iconColor: 'text-blue-600',
    tag: 'Score Builder',
  },
  {
    role: 'company' as const,
    label: 'Company',
    email: 'company@bcx.io',
    desc: 'Manage teams, track BCX index and purchase verified carbon credits.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    gradient: 'from-brand-orange to-brand-ember',
    bgLight: 'bg-brand-sand',
    borderActive: 'border-brand-orange ring-brand-orange/20',
    iconColor: 'text-brand-orange',
    tag: 'Credit Buyer',
  },
  {
    role: 'farmer' as const,
    label: 'Farmer',
    email: 'farmer@bcx.io',
    desc: 'Generate carbon credits from sustainable practices and monetize them.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M12 22c4-4 8-7.5 8-12A8 8 0 0 0 4 10c0 4.5 4 8 8 12z" />
        <path d="M12 10a2 2 0 1 0 0-4 2 2 0 1 0 0 4z" />
        <path d="M12 10v4" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-green-600',
    bgLight: 'bg-emerald-50',
    borderActive: 'border-emerald-500 ring-emerald-500/20',
    iconColor: 'text-emerald-600',
    tag: 'Credit Seller',
  },
];

export const LoginForm = ({ onSubmit, onSwitch, loading }: LoginFormProps) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [password, setPassword] = useState('pass123');

  const selected = DEMO_ACCOUNTS.find((a) => a.role === selectedRole);

  const handleQuickLogin = () => {
    if (!selected) return;
    void onSubmit({ email: selected.email, password });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-orange">
          Welcome to BCX
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-ink">
          Choose your role
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select how you'd like to experience the platform.
        </p>
      </div>

      {/* Role Cards */}
      <div className="space-y-3">
        {DEMO_ACCOUNTS.map((account) => {
          const isActive = selectedRole === account.role;
          return (
            <button
              key={account.role}
              id={`role-card-${account.role}`}
              type="button"
              onClick={() => setSelectedRole(account.role)}
              className={cx(
                'group relative flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200',
                isActive
                  ? `${account.borderActive} ring-4 shadow-soft`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              )}
            >
              {/* Icon Circle */}
              <div
                className={cx(
                  'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200',
                  isActive
                    ? `bg-gradient-to-br ${account.gradient} text-white shadow-md`
                    : `${account.bgLight} ${account.iconColor}`
                )}
              >
                {account.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-brand-ink">
                    {account.label}
                  </h3>
                  <span
                    className={cx(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                      isActive
                        ? `bg-gradient-to-r ${account.gradient} text-white`
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {account.tag}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500 leading-snug">
                  {account.desc}
                </p>
              </div>

              {/* Checkmark */}
              <div
                className={cx(
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 mt-1',
                  isActive
                    ? `bg-gradient-to-br ${account.gradient} border-transparent text-white`
                    : 'border-slate-300'
                )}
              >
                {isActive && (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 7.5L5.5 10L11 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Credentials Panel – appears when a role is selected */}
      {selected && (
        <div className="animate-slideUp rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className={cx('h-2 w-2 rounded-full bg-gradient-to-r', selected.gradient)} />
            <p className="text-xs font-medium text-slate-500">
              Signing in as <span className="font-bold text-brand-ink">{selected.email}</span>
            </p>
          </div>

          <label className="field">
            <span className="field-label">Password</span>
            <input
              id="login-password"
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          <button
            id="btn-sign-in"
            className="btn-primary w-full"
            type="button"
            disabled={loading}
            onClick={handleQuickLogin}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              `Continue as ${selected.label}`
            )}
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-400 font-medium">or</span>
        </div>
      </div>

      {/* Switch to signup */}
      <p className="text-center text-sm text-slate-500">
        New user?{' '}
        <button
          id="btn-create-account"
          className="font-semibold text-brand-orange hover:text-brand-ember transition-colors"
          type="button"
          onClick={onSwitch}
        >
          Create account
        </button>
      </p>
    </div>
  );
};
