import { useState } from 'react';

interface EmailLoginProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

export const EmailLogin = ({ onSubmit, onClose, loading }: EmailLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="animate-slideUp mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-ink">Sign in with Email</p>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-brand-ink">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <label className="field">
        <span className="field-label">Email</span>
        <input
          id="email-input"
          className="field-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
      </label>

      <label className="field">
        <span className="field-label">Password</span>
        <div className="relative">
          <input
            id="email-password-input"
            className="field-input pr-10"
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPwd ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>
      </label>

      <button
        id="btn-email-submit"
        type="button"
        disabled={loading || !email || !password}
        onClick={() => void onSubmit(email, password)}
        className="btn-primary w-full"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </div>
  );
};
