import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    id: 1,
    eyebrow: 'BHARAT CARBON EXCHANGE',
    headline: 'India\'s First\nUnified Carbon\nEcosystem',
    sub: 'Connecting farmers, companies, and employees in a single verified marketplace for carbon credits.',
    stat1: { label: 'tCO₂e Traded', value: '5,100+' },
    stat2: { label: 'Active Participants', value: '12,480+' },
    accent: '#F15A22',
    bg: 'from-[#1A1A2E] to-[#16213E]',
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="60" cy="60" r="54" fill="rgba(241,90,34,0.12)" />
        <circle cx="60" cy="60" r="38" fill="rgba(241,90,34,0.18)" />
        <path d="M60 30 C60 30 42 48 42 62 C42 72 50 80 60 80 C70 80 78 72 78 62 C78 48 60 30 60 30Z" fill="#F15A22" opacity="0.9" />
        <path d="M60 80 L60 95" stroke="#F15A22" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 62 C60 62 50 55 48 48" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <circle cx="60" cy="60" r="6" fill="white" opacity="0.9" />
        <path d="M30 60 Q45 45 60 60 Q75 75 90 60" stroke="rgba(241,90,34,0.5)" strokeWidth="1.5" fill="none" />
        <path d="M25 70 Q40 55 60 70 Q80 85 95 70" stroke="rgba(241,90,34,0.3)" strokeWidth="1.5" fill="none" />
      </svg>
    )
  },
  {
    id: 2,
    eyebrow: 'THREE ROLES. ONE PLATFORM.',
    headline: 'Every\nStakeholder\nBenefits',
    sub: 'Farmers earn. Companies offset. Employees act. BCX makes sustainability measurable and profitable.',
    stat1: { label: 'Farmer Avg Earnings', value: '₹18,400' },
    stat2: { label: 'BCX Index Score', value: '58 / 100' },
    accent: '#16A34A',
    bg: 'from-[#0F2027] to-[#203A43]',
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="60" cy="60" r="54" fill="rgba(22,163,74,0.12)" />
        {/* Farmer */}
        <circle cx="30" cy="70" r="14" fill="rgba(22,163,74,0.25)" />
        <path d="M30 63 L30 55 M27 57 L30 55 L33 57" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
        <circle cx="30" cy="68" r="4" fill="#16A34A" opacity="0.8" />
        {/* Company */}
        <rect x="48" y="35" width="24" height="30" rx="3" fill="rgba(241,90,34,0.25)" />
        <rect x="52" y="39" width="6" height="6" rx="1" fill="#F15A22" opacity="0.8" />
        <rect x="62" y="39" width="6" height="6" rx="1" fill="#F15A22" opacity="0.8" />
        <rect x="52" y="50" width="6" height="6" rx="1" fill="#F15A22" opacity="0.8" />
        <rect x="62" y="50" width="6" height="6" rx="1" fill="#F15A22" opacity="0.8" />
        <rect x="55" y="56" width="10" height="9" rx="1" fill="#F15A22" opacity="0.6" />
        {/* Employee */}
        <circle cx="90" cy="65" r="14" fill="rgba(59,130,246,0.25)" />
        <circle cx="90" cy="60" r="5" fill="#3B82F6" opacity="0.8" />
        <path d="M82 75 Q86 70 90 70 Q94 70 98 75" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Connecting lines */}
        <path d="M44 65 L30 70" stroke="white" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
        <path d="M72 65 L90 65" stroke="white" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
        {/* Credits flow */}
        <path d="M44 55 Q60 45 76 55" stroke="rgba(241,90,34,0.7)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
      </svg>
    )
  }
];

export const SplashPage = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const advance = () => {
    if (animating) return;
    if (current < slides.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((prev) => prev + 1);
        setAnimating(false);
      }, 300);
    } else {
      navigate('/role', { replace: true });
    }
  };

  useEffect(() => {
    const timer = setTimeout(advance, 2800);
    return () => clearTimeout(timer);
  }, [current]);

  const slide = slides[current]!;

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-gradient-to-br ${slide.bg} px-6 pb-14 pt-16 transition-all duration-500`}
      onClick={advance}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 70% 20%, ${slide.accent}55, transparent 55%),
                       radial-gradient(circle at 20% 80%, ${slide.accent}30, transparent 45%)`
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex w-full items-center justify-between">
        <p className="text-xs font-bold tracking-[0.2em] text-white/60">{slide.eyebrow}</p>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/role', { replace: true }); }}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 backdrop-blur hover:bg-white/20"
        >
          Skip →
        </button>
      </div>

      {/* Central illustration */}
      <div className="relative z-10 flex w-64 h-64 items-center justify-center drop-shadow-2xl">
        <div
          className={`w-full h-full transition-all duration-500 ${animating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}
        >
          {slide.icon}
        </div>
      </div>

      {/* Text */}
      <div className={`relative z-10 w-full space-y-4 transition-all duration-500 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <h1 className="whitespace-pre-line text-4xl font-extrabold leading-tight tracking-tight text-white">
          {slide.headline}
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-white/60">{slide.sub}</p>

        {/* Stats */}
        <div className="flex gap-4 pt-2">
          <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs text-white/50 uppercase tracking-wider">{slide.stat1.label}</p>
            <p className="mt-0.5 text-xl font-extrabold" style={{ color: slide.accent }}>{slide.stat1.value}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs text-white/50 uppercase tracking-wider">{slide.stat2.label}</p>
            <p className="mt-0.5 text-xl font-extrabold" style={{ color: slide.accent }}>{slide.stat2.value}</p>
          </div>
        </div>

        {/* Dots */}
        <div className="flex gap-2 pt-4">
          {slides.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === current ? '28px' : '8px',
                backgroundColor: i === current ? slide.accent : 'rgba(255,255,255,0.25)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
