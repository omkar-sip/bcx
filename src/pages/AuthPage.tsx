import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneOTPLogin } from '../components/auth/PhoneOTPLogin';
import { SocialLogin } from '../components/auth/SocialLogin';
import { EmailLogin } from '../components/auth/EmailLogin';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';

const roleLabels: Record<Role, { label: string; color: string; desc: string }> = {
  employee: { label: 'Employee', color: 'text-blue-600', desc: 'Log eco-actions & track your score' },
  company:  { label: 'Company',  color: 'text-brand-orange', desc: 'Manage teams & carbon credits' },
  farmer:   { label: 'Farmer',   color: 'text-emerald-600', desc: 'Generate & sell carbon credits' }
};

export const AuthPage = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const loading = useAuthStore((s) => s.loading);
  const signIn = useAuthStore((s) => s.signIn);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithPhoneUid = useAuthStore((s) => s.signInWithPhoneUid);
  const signOut = useAuthStore((s) => s.signOut);

  const [showEmail, setShowEmail] = useState(false);

  // Read selected role from session
  const storedRole = sessionStorage.getItem('bcx_selected_role') as Role | null;
  const role = storedRole ?? 'employee';
  const roleMeta = roleLabels[role];

  // If no role selected, push back
  useEffect(() => {
    if (!storedRole) navigate('/role', { replace: true });
  }, [storedRole, navigate]);

  const handleStartOver = async () => {
    await signOut();
    sessionStorage.removeItem('bcx_selected_role');
    navigate('/splash', { replace: true });
  };

  const handleBack = async () => {
    await signOut();
    navigate('/role');
  };

  const handlePhoneSuccess = async (uid: string, phone: string) => {
    try {
      await signInWithPhoneUid(uid, phone, role);
      pushToast('Signed in successfully!', 'success');
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Sign in failed.', 'error');
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle(role);
      pushToast('Signed in with Google!', 'success');
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Google sign in failed.', 'error');
    }
  };

  const handleFacebook = () => {
    pushToast('Facebook login coming soon — not yet enabled.', 'info');
  };

  const handleEmail = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      pushToast('Signed in successfully!', 'success');
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Invalid credentials.', 'error');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-mist">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(241,90,34,0.07),transparent_40%),radial-gradient(circle_at_85%_75%,rgba(22,163,74,0.06),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-5 py-10">
        {/* Back + logo + start over */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => void handleBack()}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <div className="inline-flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-orange text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10 2C10 2 5 7 5 11a5 5 0 0010 0c0-4-5-9-5-9z" />
              </svg>
            </span>
            <span className="text-sm font-bold tracking-wider text-brand-ink">BCX</span>
          </div>
          <button
            type="button"
            onClick={() => void handleStartOver()}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Start Over
          </button>
        </div>

        {/* Role pill */}
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <span className={`text-sm font-bold ${roleMeta.color}`}>{roleMeta.label}</span>
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-xs text-slate-500">{roleMeta.desc}</span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-ink">Login / Sign Up</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter your mobile number to receive a 6-digit code.
          </p>
        </div>

        {/* Phone OTP — PRIMARY */}
        <PhoneOTPLogin onSuccess={handlePhoneSuccess} onError={(m) => pushToast(m, 'error')} />

        {/* Social — secondary */}
        <div className="mt-6">
          <SocialLogin
            onGoogle={handleGoogle}
            onFacebook={handleFacebook}
            onEmailToggle={() => setShowEmail((v) => !v)}
            loading={loading}
          />

          {/* Email panel — collapsible */}
          {showEmail && (
            <EmailLogin
              onSubmit={handleEmail}
              onClose={() => setShowEmail(false)}
              loading={loading}
            />
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          By continuing, you agree to BCX{' '}
          <span className="font-semibold text-brand-orange">Terms of Service</span> and{' '}
          <span className="font-semibold text-brand-orange">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};
