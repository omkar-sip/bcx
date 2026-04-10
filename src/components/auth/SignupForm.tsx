import { useMemo, useState } from 'react';
import { cx } from '../../lib/utils';
import type { Role } from '../../types';

interface SignupFormProps {
  onSubmit: (payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
    company?: string;
  }) => Promise<void>;
  onSwitch: () => void;
  loading: boolean;
}

const roleMeta: Array<{ role: Role; label: string; desc: string; icon: string }> = [
  { role: 'employee', label: 'Employee', desc: 'Log actions and build score', icon: 'E' },
  { role: 'company', label: 'Company', desc: 'Track teams and buy credits', icon: 'C' },
  { role: 'farmer', label: 'Farmer', desc: 'Generate and sell credits', icon: 'F' }
];

export const SignupForm = ({ onSubmit, onSwitch, loading }: SignupFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [company, setCompany] = useState('');

  const roleDescription = useMemo(
    () => roleMeta.find((item) => item.role === role)?.desc ?? '',
    [role]
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({ name, email, password, role, company });
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-orange">
          Join BCX
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-ink">Create account</h2>
      </div>

      <label className="field">
        <span className="field-label">Name</span>
        <input
          className="field-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your full name"
          required
        />
      </label>

      <label className="field">
        <span className="field-label">Email</span>
        <input
          className="field-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
        />
      </label>

      <label className="field">
        <span className="field-label">Password</span>
        <input
          className="field-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 6 characters"
          minLength={6}
          required
        />
      </label>

      <div className="field">
        <span className="field-label">Role</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {roleMeta.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => setRole(item.role)}
              className={cx(
                'rounded-xl border px-3 py-2 text-left transition',
                role === item.role
                  ? 'border-brand-orange bg-brand-sand'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              )}
            >
              <p className="text-xs font-semibold text-slate-500">{item.icon}</p>
              <p className="mt-1 text-sm font-bold text-brand-ink">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">{roleDescription}</p>
      </div>

      {role === 'employee' ? (
        <label className="field">
          <span className="field-label">Company</span>
          <input
            className="field-input"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="GreenTech Inc"
            required
          />
        </label>
      ) : null}

      <button className="btn-primary w-full" type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button className="font-semibold text-brand-orange" type="button" onClick={onSwitch}>
          Sign in
        </button>
      </p>
    </form>
  );
};
