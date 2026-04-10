import { useState } from 'react';
import { cx } from '../../lib/utils';

interface SocialLoginProps {
  onGoogle: () => Promise<void>;
  onFacebook: () => void;
  onEmailToggle: () => void;
  loading: boolean;
}

export const SocialLogin = ({ onGoogle, onFacebook, onEmailToggle, loading }: SocialLoginProps) => (
  <div className="space-y-4">
    {/* Divider */}
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-medium text-slate-400">Or continue with</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>

    {/* Social row */}
    <div className="grid grid-cols-3 gap-3">
      {/* Facebook – dummy */}
      <SocialBtn
        id="btn-facebook"
        label="Facebook"
        onClick={onFacebook}
        disabled={loading}
        icon={
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#1877F2">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.931-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
          </svg>
        }
      />

      {/* Google */}
      <SocialBtn
        id="btn-google"
        label="Google"
        onClick={() => void onGoogle()}
        disabled={loading}
        icon={
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        }
      />

      {/* Email */}
      <SocialBtn
        id="btn-email-login"
        label="Email"
        onClick={onEmailToggle}
        disabled={loading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M2 8l10 6 10-6" />
          </svg>
        }
      />
    </div>
  </div>
);

const SocialBtn = ({
  id,
  label,
  onClick,
  disabled,
  icon
}: {
  id: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
}) => (
  <button
    id={id}
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cx(
      'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white py-3 text-xs font-semibold text-slate-500 shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);
