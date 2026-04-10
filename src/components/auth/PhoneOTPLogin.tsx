import { useEffect, useRef, useState } from 'react';
import { auth, RecaptchaVerifier, PhoneAuthProvider } from '../../lib/firebase';
import {
  signInWithPhoneNumber,
  type ConfirmationResult,
  type ApplicationVerifier
} from 'firebase/auth';
import { cx } from '../../lib/utils';

interface PhoneOTPLoginProps {
  onSuccess: (uid: string, phone: string) => void;
  onError: (msg: string) => void;
}

export const PhoneOTPLogin = ({ onSuccess, onError }: PhoneOTPLoginProps) => {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const confirmRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOTP = async () => {
    if (!auth) { onError('Firebase not configured.'); return; }
    if (phone.length !== 10) { onError('Enter a valid 10-digit mobile number.'); return; }

    setLoading(true);
    try {
      if (!window._recaptchaVerifier) {
        window._recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {}
        });
      }
      const fullPhone = `+91${phone}`;
      const confirm = await signInWithPhoneNumber(auth, fullPhone, window._recaptchaVerifier as ApplicationVerifier);
      confirmRef.current = confirm;
      setStep('otp');
      setCountdown(30);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) { onError('Enter the complete 6-digit OTP.'); return; }
    if (!confirmRef.current) { onError('Session expired. Please resend OTP.'); return; }

    setLoading(true);
    try {
      const result = await confirmRef.current.confirm(code);
      onSuccess(result.user.uid, `+91${phone}`);
    } catch {
      onError('Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when full
    if (next.every((d) => d !== '') && index === 5) {
      setTimeout(verifyOTP, 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="space-y-5">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaRef} />

      {step === 'phone' ? (
        <>
          <div>
            <label className="field-label mb-2 block">Mobile Number</label>
            <div className="flex overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition focus-within:border-brand-orange focus-within:ring-4 focus-within:ring-brand-orange/15">
              {/* India flag + code */}
              <div className="flex items-center gap-2 border-r border-slate-200 bg-slate-50 px-4">
                <span className="text-xl leading-none">🇮🇳</span>
                <span className="text-sm font-bold text-brand-ink">+91</span>
                <svg viewBox="0 0 10 6" fill="none" className="h-2.5 w-2.5 text-slate-400">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <input
                id="phone-input"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && void sendOTP()}
                placeholder="98765 43210"
                className="flex-1 bg-transparent px-4 py-4 text-lg font-semibold tracking-widest text-brand-ink outline-none placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal"
              />
              {/* Mic icon hint */}
              <button type="button" className="flex items-center px-3 text-slate-300">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 10a7 7 0 0014 0M12 19v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">We'll send a 6-digit OTP to verify your number.</p>
          </div>

          <button
            id="btn-send-otp"
            type="button"
            disabled={loading || phone.length !== 10}
            onClick={() => void sendOTP()}
            className="btn-primary w-full py-4 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending OTP…
              </span>
            ) : 'Continue'}
          </button>
        </>
      ) : (
        <>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <button type="button" onClick={() => setStep('phone')} className="text-slate-400 hover:text-brand-ink">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div>
                <p className="text-sm font-semibold text-brand-ink">Enter OTP</p>
                <p className="text-xs text-slate-400">Sent to +91 {phone}</p>
              </div>
            </div>

            {/* 6-digit OTP boxes */}
            <div className="flex gap-2 justify-between">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  id={`otp-${i}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={cx(
                    'h-14 w-full rounded-2xl border-2 text-center text-2xl font-bold text-brand-ink outline-none transition-all',
                    digit
                      ? 'border-brand-orange bg-brand-sand ring-2 ring-brand-orange/20'
                      : 'border-slate-200 bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15'
                  )}
                />
              ))}
            </div>

            <div className="mt-3 flex justify-between text-xs text-slate-400">
              <span>OTP valid for 10 minutes</span>
              {countdown > 0 ? (
                <span>Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => { setOtp(['','','','','','']); void sendOTP(); }}
                  className="font-semibold text-brand-orange"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>

          <button
            id="btn-verify-otp"
            type="button"
            disabled={loading || otp.some((d) => !d)}
            onClick={() => void verifyOTP()}
            className="btn-primary w-full py-4 text-base"
          >
            {loading ? 'Verifying…' : 'Verify & Continue'}
          </button>
        </>
      )}
    </div>
  );
};

// Extend window for reCAPTCHA
declare global {
  interface Window {
    _recaptchaVerifier?: InstanceType<typeof RecaptchaVerifier>;
  }
}
