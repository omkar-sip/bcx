import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { upsertDocument } from '../lib/firestore';
import { useToast } from '../hooks/useToast';
import { cx } from '../lib/utils';
import type { UserProfile } from '../types';

/* ─── Step progress bar ─────────────────────────────────────── */
const StepBar = ({ current, total }: { current: number; total: number }) => (
  <div className="mb-8">
    <div className="mb-2 flex justify-between text-xs text-slate-400">
      <span>Step {current} of {total}</span>
      <span>{Math.round((current / total) * 100)}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-slate-200">
      <div
        className="h-1.5 rounded-full bg-brand-orange transition-all duration-500"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  </div>
);

/* ─── Field wrapper ───────────────────────────────────────────── */
const Field = ({
  label, icon, children
}: { label: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <label className="block space-y-1.5">
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-brand-orange">{icon}</span>}
      <span className="field-label">{label}</span>
    </div>
    {children}
  </label>
);

/** Save profile locally + attempt Firestore (never blocks navigation) */
const safeSave = async (profile: UserProfile, setProfile: (p: UserProfile) => void): Promise<void> => {
  setProfile(profile); // always update local state first
  try {
    await upsertDocument('users', profile.uid, {
      ...profile,
      createdAt: profile.createdAt instanceof Date
        ? profile.createdAt.toISOString()
        : profile.createdAt
    });
  } catch {
    // Firestore unavailable or rules not set — data saved locally, will sync later
  }
};

function useLocationValidation() {
  const [isValid, setIsValid] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const validate = async (loc: string) => {
    const trimmed = loc.trim();
    if (!trimmed) { setIsValid('idle'); return; }
    setIsValid('validating');
    try {
      const apiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY;
      const url = apiKey 
        ? `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(trimmed)}&format=json&limit=1`
        : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
        
      await new Promise(res => setTimeout(res, 800));
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) throw new Error('Api err');
      const data = await res.json();
      setIsValid(Array.isArray(data) && data.length > 0 ? 'valid' : 'invalid');
    } catch {
      setIsValid('invalid');
    }
  };
  return { isValid, setIsValid, validate };
}

/* ─── Employee profile setup (3 steps) ──────────────────────── */
const EmployeeSetup = ({ profile, onDone }: { profile: UserProfile; onDone: () => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: profile.name ?? '', designation: '', company: profile.company ?? '', location: '' });
  const [saving, setSaving] = useState(false);
  const locStatus = useLocationValidation();
  const setProfile = useAuthStore((s) => s.setProfile);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const updated: UserProfile = {
      ...profile,
      name: form.name,
      designation: form.designation,
      company: form.company,
      location: form.location,
      profileComplete: true,
    };
    await safeSave(updated, setProfile);
    setSaving(false);
    onDone();
  };

  return (
    <div className="space-y-6">
      <StepBar current={step} total={3} />

      {step === 1 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-ink">Your Name</h2>
            <p className="mt-1 text-sm text-slate-500">How should we address you?</p>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-sand text-3xl font-extrabold text-brand-orange ring-4 ring-brand-orange/20">
                {form.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-white shadow">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          <Field label="Full Name" icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}>
            <input className="field-input text-base" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ramesh Kumar" />
          </Field>

          <Field label="Designation" icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>}>
            <input className="field-input text-base" value={form.designation} onChange={(e) => set('designation', e.target.value)} placeholder="Software Engineer" />
          </Field>

          <button disabled={!form.name} onClick={() => setStep(2)} className="btn-primary w-full py-4">
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-ink">Your Company</h2>
            <p className="mt-1 text-sm text-slate-500">Which organisation are you part of?</p>
          </div>

          <Field label="Company Name" icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>}>
            <input className="field-input text-base" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="GreenTech India Pvt. Ltd." />
          </Field>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-4">← Back</button>
            <button disabled={!form.company} onClick={() => setStep(3)} className="btn-primary flex-1 py-4">Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-ink">Your Location</h2>
            <p className="mt-1 text-sm text-slate-500">Help us personalise your BCX experience.</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-slate-500">
                <span className="text-brand-orange"><svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg></span>
                City / District
              </span>
              {locStatus.isValid === 'invalid' && <span className="text-[10px] text-red-500 font-semibold">Not found</span>}
            </div>
            <div className="relative">
              <input className="field-input text-base pr-8" value={form.location} onChange={(e) => { set('location', e.target.value); locStatus.setIsValid('idle'); }} onBlur={() => locStatus.validate(form.location)} placeholder="Mumbai, Maharashtra" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {locStatus.isValid === 'validating' && <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-orange"></span>}
                {locStatus.isValid === 'valid' && <span className="text-emerald-500 font-bold">✓</span>}
                {locStatus.isValid === 'invalid' && <span className="text-red-500 font-bold">✗</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-4">← Back</button>
            <button disabled={!form.location || saving} onClick={save} className="btn-primary flex-1 py-4">
              {saving ? 'Saving…' : 'Complete Setup →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Company profile setup (3 steps) ───────────────────────── */
const CompanySetup = ({ profile, onDone }: { profile: UserProfile; onDone: () => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: profile.name ?? '', cin: '', industry: '', size: '', location: '' });
  const [saving, setSaving] = useState(false);
  const locStatus = useLocationValidation();
  const setProfile = useAuthStore((s) => s.setProfile);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const updated: UserProfile = {
      ...profile,
      name: form.name,
      company: form.name,
      cin: form.cin,
      industry: form.industry,
      companySize: form.size,
      location: form.location,
      profileComplete: true,
    };
    await safeSave(updated, setProfile);
    setSaving(false);
    onDone();
  };

  const industries = ['Agriculture', 'Manufacturing', 'IT & Tech', 'Logistics', 'Energy', 'Finance', 'Retail', 'Other'];
  const sizes = ['1–10', '11–50', '51–200', '201–500', '500+'];

  return (
    <div className="space-y-6">
      <StepBar current={step} total={3} />

      {step === 1 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-ink">Organisation Details</h2>
            <p className="mt-1 text-sm text-slate-500">Tell us about your company.</p>
          </div>
          <Field label="Company Name">
            <input className="field-input text-base" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="GreenTech India Pvt. Ltd." />
          </Field>
          <Field label="CIN / Registration Number (optional)">
            <input className="field-input text-base" value={form.cin} onChange={(e) => set('cin', e.target.value)} placeholder="U12345MH2010PTC123456" />
          </Field>
          <button disabled={!form.name} onClick={() => setStep(2)} className="btn-primary w-full py-4">Next →</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-ink">Industry & Size</h2>
            <p className="mt-1 text-sm text-slate-500">This helps calibrate your BCX Index.</p>
          </div>

          <div>
            <span className="field-label mb-2 block">Industry</span>
            <div className="flex flex-wrap gap-2">
              {industries.map((ind) => (
                <button key={ind} type="button" onClick={() => set('industry', ind)}
                  className={cx('rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition',
                    form.industry === ind ? 'border-brand-orange bg-brand-sand text-brand-orange' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}>
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="field-label mb-2 block">Team Size</span>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button key={s} type="button" onClick={() => set('size', s)}
                  className={cx('rounded-xl border-2 px-4 py-1.5 text-sm font-medium transition',
                    form.size === s ? 'border-brand-orange bg-brand-sand text-brand-orange' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-4">← Back</button>
            <button disabled={!form.industry || !form.size} onClick={() => setStep(3)} className="btn-primary flex-1 py-4">Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-ink">Headquarters</h2>
            <p className="mt-1 text-sm text-slate-500">Where is your company based?</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="field-label block">City / State</span>
              {locStatus.isValid === 'invalid' && <span className="text-[10px] text-red-500 font-semibold">Not found</span>}
            </div>
            <div className="relative">
              <input className="field-input text-base pr-8" value={form.location} onChange={(e) => { set('location', e.target.value); locStatus.setIsValid('idle'); }} onBlur={() => locStatus.validate(form.location)} placeholder="Mumbai, Maharashtra" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {locStatus.isValid === 'validating' && <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-orange"></span>}
                {locStatus.isValid === 'valid' && <span className="text-emerald-500 font-bold">✓</span>}
                {locStatus.isValid === 'invalid' && <span className="text-red-500 font-bold">✗</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-4">← Back</button>
            <button disabled={!form.location || saving} onClick={save} className="btn-primary flex-1 py-4">
              {saving ? 'Saving…' : 'Complete Setup →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Farmer profile setup (4 steps) ────────────────────────── */
const FarmerSetup = ({ profile, onDone }: { profile: UserProfile; onDone: () => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: profile.name ?? '', phone: profile.phone ?? '', farmSize: '', cropType: '', village: '' });
  const [saving, setSaving] = useState(false);
  const locStatus = useLocationValidation();
  const setProfile = useAuthStore((s) => s.setProfile);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const updated: UserProfile = {
      ...profile,
      name: form.name,
      phone: form.phone,
      farmSize: form.farmSize,
      cropType: form.cropType,
      village: form.village,
      profileComplete: true,
    };
    await safeSave(updated, setProfile);
    setSaving(false);
    onDone();
  };

  const crops = ['Rice', 'Wheat', 'Sugarcane', 'Cotton', 'Soybean', 'Vegetables', 'Fruits', 'Other'];

  return (
    <div className="space-y-6">
      <StepBar current={step} total={4} />

      {step === 1 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-ink">Your Name</h2>
            <p className="mt-1 text-sm text-slate-500">What should we call you?</p>
          </div>
          <div className="flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-3xl font-extrabold text-emerald-600 ring-4 ring-emerald-500/20">
              {form.name?.[0]?.toUpperCase() ?? '🌱'}
            </div>
          </div>
          <Field label="Full Name">
            <input className="field-input text-base" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ramesh Kumar" />
          </Field>
          <Field label="Mobile Number">
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/15">
              <span className="flex items-center gap-1.5 border-r border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-brand-ink">🇮🇳 +91</span>
              <input className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" type="tel" inputMode="numeric" maxLength={10} value={form.phone.replace('+91', '')} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9988776655" />
              {form.phone.replace('+91', '').length === 10 && (
                <span className="flex items-center pr-3 text-emerald-500">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </span>
              )}
            </div>
          </Field>
          <button disabled={!form.name} onClick={() => setStep(2)} className="btn-primary w-full py-4">Next →</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-ink">Farm Size</h2>
            <p className="mt-1 text-sm text-slate-500">How large is your farm?</p>
          </div>
          <Field label="Farm Size (in acres)">
            <input className="field-input text-base" type="number" value={form.farmSize} onChange={(e) => set('farmSize', e.target.value)} placeholder="e.g. 5.5" />
          </Field>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-4">← Back</button>
            <button disabled={!form.farmSize} onClick={() => setStep(3)} className="btn-primary flex-1 py-4">Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-ink">Primary Crop</h2>
            <p className="mt-1 text-sm text-slate-500">What do you mainly grow?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {crops.map((c) => (
              <button key={c} type="button" onClick={() => set('cropType', c)}
                className={cx('rounded-xl border-2 px-4 py-2 text-sm font-medium transition',
                  form.cropType === c ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-4">← Back</button>
            <button disabled={!form.cropType} onClick={() => setStep(4)} className="btn-primary flex-1 py-4">Next →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-ink">Your Location</h2>
            <p className="mt-1 text-sm text-slate-500">Village, district and state.</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-slate-500">
                <span className="text-brand-orange"><svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg></span>
                Village / District
              </span>
              {locStatus.isValid === 'invalid' && <span className="text-[10px] text-red-500 font-semibold">Not found</span>}
            </div>
            <div className="relative">
              <input className="field-input text-base pr-8" value={form.village} onChange={(e) => { set('village', e.target.value); locStatus.setIsValid('idle'); }} onBlur={() => locStatus.validate(form.village)} placeholder="Bhuj, Kutch, Gujarat 370001" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {locStatus.isValid === 'validating' && <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-orange"></span>}
                {locStatus.isValid === 'valid' && <span className="text-emerald-500 font-bold">✓</span>}
                {locStatus.isValid === 'invalid' && <span className="text-red-500 font-bold">✗</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="btn-secondary flex-1 py-4">← Back</button>
            <button disabled={!form.village || saving} onClick={save} className="btn-primary flex-1 py-4">
              {saving ? 'Saving…' : 'Complete Setup →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main ProfileSetup page ─────────────────────────────────── */
export const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.userProfile);
  const signOut = useAuthStore((s) => s.signOut);

  if (!profile) {
    navigate('/auth', { replace: true });
    return null;
  }

  const onDone = () => navigate('/dashboard', { replace: true });

  const handleStartOver = async () => {
    await signOut();
    sessionStorage.removeItem('bcx_selected_role');
    navigate('/splash', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-mist">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(241,90,34,0.07),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-5 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-brand-ink"
              aria-label="Go back"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white shadow">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M10 2C10 2 5 7 5 11a5 5 0 0010 0c0-4-5-9-5-9z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-orange">Profile Setup</p>
              <p className="text-sm font-bold text-brand-ink capitalize">{profile.role} · BCX</p>
            </div>
          </div>

          {/* Start over */}
          <button
            type="button"
            onClick={() => void handleStartOver()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm transition hover:border-red-200 hover:text-red-500"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Start Over
          </button>
        </div>

        {profile.role === 'employee' && <EmployeeSetup profile={profile} onDone={onDone} />}
        {profile.role === 'company' && <CompanySetup profile={profile} onDone={onDone} />}
        {profile.role === 'farmer' && <FarmerSetup profile={profile} onDone={onDone} />}
      </div>
    </div>
  );
};
