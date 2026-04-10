import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
  onSwitch: () => void;
  loading: boolean;
}

export const LoginForm = ({ onSubmit, onSwitch, loading }: LoginFormProps) => {
  const [email, setEmail] = useState('employee@bcx.io');
  const [password, setPassword] = useState('pass123');

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({ email, password });
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-orange">
          Welcome back
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-ink">Sign in</h2>
        <p className="mt-2 text-sm text-slate-500">
          Use demo accounts: `employee@bcx.io`, `company@bcx.io`, `farmer@bcx.io` with `pass123`.
        </p>
      </div>

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
          placeholder="Your password"
          required
        />
      </label>

      <button className="btn-primary w-full" type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in to BCX'}
      </button>

      <p className="text-center text-sm text-slate-500">
        New user?{' '}
        <button className="font-semibold text-brand-orange" type="button" onClick={onSwitch}>
          Create account
        </button>
      </p>
    </form>
  );
};
