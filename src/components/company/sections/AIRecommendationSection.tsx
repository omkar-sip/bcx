/**
 * AI-Based Recommendation System – Company dashboard section
 * Calls Gemini with the company's live scope data and renders actionable suggestions.
 * Falls back to rule-based recommendations when no API key is configured.
 */
import { useEffect, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useCompanyInputStore } from '../../../store/companyInputStore';
import { cx } from '../../../lib/utils';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const hasKey = Boolean(apiKey && !apiKey.startsWith('YOUR_GEMINI_'));
const genAI = hasKey ? new GoogleGenerativeAI(apiKey!) : null;

// ── Fallback rule-based recommendations ───────────────────────────────────────
function buildFallback(
  s1: number,
  s2: number,
  s3: number,
  renewable: number,
  total: number
): Recommendation[] {
  const items: Recommendation[] = [];
  const dominant = s1 >= s2 && s1 >= s3 ? 'scope1' : s2 >= s3 ? 'scope2' : 'scope3';

  if (dominant === 'scope2') {
    items.push({
      id: 'r1', priority: 'High', category: 'Energy',
      title: 'Switch to renewable electricity procurement',
      detail: `Scope 2 contributes ${((s2 / Math.max(total, 1)) * 100).toFixed(0)}% of total emissions. Increasing renewable coverage from ${Math.round(renewable)}% to 50%+ is your fastest and cheapest reduction lever.`,
      saving: `Est. ${((s2 * (0.5 - Math.min(0.5, renewable / 100))).toFixed(1))} tCO₂e reduction`,
      icon: '⚡'
    });
    items.push({
      id: 'r2', priority: 'Medium', category: 'Operations',
      title: 'Install smart metering & HVAC controls',
      detail: 'Automated metering across sites reduces standby draw by 10–15% with a typical payback of 6–18 months.',
      saving: `Est. ${(s2 * 0.12).toFixed(1)} tCO₂e/yr`,
      icon: '🌡️'
    });
  }
  if (dominant === 'scope1') {
    items.push({
      id: 'r3', priority: 'High', category: 'Fleet',
      title: 'Electrify highest-utilisation fleet vehicles',
      detail: `Scope 1 is your largest emission source. Transitioning the top 30% of vehicles by mileage to EV eliminates those fuel emissions entirely.`,
      saving: `Est. ${(s1 * 0.3).toFixed(1)} tCO₂e/yr`,
      icon: '🚗'
    });
    items.push({
      id: 'r4', priority: 'Medium', category: 'Fuel',
      title: 'Move backup generators to gird-tied UPS or solar batteries',
      detail: 'Generator diesel is among the highest-cost and highest-emission fuel sources. Solar + battery backup breaks even within 3–5 years in India.',
      saving: 'Reduces generator Scope 1 to zero',
      icon: '🔋'
    });
  }
  if (dominant === 'scope3') {
    items.push({
      id: 'r5', priority: 'High', category: 'People',
      title: 'Formalise hybrid work policy with commute kms tracking',
      detail: 'Scope 3 commute emissions are the most controllable through policy. A 2-day WFH mandate alone can cut employee commute emissions by 30–40%.',
      saving: `Est. ${(s3 * 0.35).toFixed(1)} tCO₂e/yr`,
      icon: '🏠'
    });
    items.push({
      id: 'r6', priority: 'Medium', category: 'Supply chain',
      title: 'Request supplier-level emission disclosures',
      detail: 'Move from spend-based to activity-based upstream data. This alone reduces GHG inventory uncertainty and improves BRSR reporting quality.',
      saving: 'Better data accuracy + stakeholder trust',
      icon: '📦'
    });
  }
  if (total > 0) {
    items.push({
      id: 'r7', priority: 'Low', category: 'Offsets',
      title: 'Bridge the residual gap with verified BCX carbon credits',
      detail: 'Use rural farmer credits on the BCX marketplace to cover what operational reductions cannot reach. Prioritise credits with high verification scores.',
      saving: `${total.toFixed(0)} tCO₂e residual to bridge`,
      icon: '🌱'
    });
  }
  return items.slice(0, 4);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Recommendation {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  title: string;
  detail: string;
  saving: string;
  icon: string;
}

// ── AI call ───────────────────────────────────────────────────────────────────
async function fetchAIRecommendations(
  s1: number, s2: number, s3: number,
  renewable: number, industry: string, country: string
): Promise<Recommendation[]> {
  if (!genAI) return [];
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a sustainability consultant for Bharat Carbon Exchange.
A ${industry || 'mid-size'} company in ${country} has these GHG emissions:
- Scope 1 (direct): ${s1.toFixed(1)} tCO2e
- Scope 2 (electricity, ${Math.round(renewable)}% renewable): ${s2.toFixed(1)} tCO2e
- Scope 3 (commute + supply chain): ${s3.toFixed(1)} tCO2e
- Total: ${(s1 + s2 + s3).toFixed(1)} tCO2e

Give exactly 4 specific, actionable recommendations to reduce emissions.
Format each as: PRIORITY|CATEGORY|TITLE|DETAIL|SAVING_ESTIMATE|EMOJI
Use | as delimiter. One per line. PRIORITY must be High, Medium, or Low.
No markdown, no numbering, no extra lines.`;

    const res = await model.generateContent(prompt);
    const lines = res.response.text().split('\n').filter(Boolean);
    return lines.slice(0, 4).map((line, i) => {
      const parts = line.split('|').map(s => s.trim());
      return {
        id: `ai-${i}`,
        priority: (['High', 'Medium', 'Low'].includes(parts[0] ?? '') ? parts[0] : 'Medium') as Recommendation['priority'],
        category: parts[1] ?? 'General',
        title: parts[2] ?? line,
        detail: parts[3] ?? '',
        saving: parts[4] ?? '',
        icon: parts[5] ?? '💡',
      };
    });
  } catch {
    return [];
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
const priorityColor: Record<Recommendation['priority'], string> = {
  High: 'bg-rose-100 text-rose-700 border-rose-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const RecommendationCard = ({ rec }: { rec: Recommendation }) => (
  <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-2xl">
      {rec.icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={cx('rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', priorityColor[rec.priority])}>
          {rec.priority}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {rec.category}
        </span>
      </div>
      <h3 className="text-sm font-bold text-brand-ink leading-snug">{rec.title}</h3>
      {rec.detail && (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{rec.detail}</p>
      )}
      {rec.saving && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1">
          <span className="text-emerald-500 text-xs">↓</span>
          <span className="text-xs font-semibold text-emerald-700">{rec.saving}</span>
        </div>
      )}
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse">
    <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-100" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-20 rounded bg-slate-100" />
      <div className="h-4 w-3/4 rounded bg-slate-100" />
      <div className="h-3 w-full rounded bg-slate-100" />
      <div className="h-3 w-2/3 rounded bg-slate-100" />
    </div>
  </div>
);

export const AIRecommendationSection = () => {
  const { emissions, scope2, industry, country } = useCompanyInputStore();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'ai' | 'rule-based' | null>(null);

  const renewable = parseFloat(scope2.renewablePercent || '0');
  const { scope1, scope2: s2, scope3, total } = emissions;

  const generate = async () => {
    setLoading(true);
    setRecs([]);
    const aiRecs = await fetchAIRecommendations(scope1, s2, scope3, renewable, industry, country);
    if (aiRecs.length > 0) {
      setRecs(aiRecs);
      setSource('ai');
    } else {
      setRecs(buildFallback(scope1, s2, scope3, renewable, total));
      setSource('rule-based');
    }
    setLoading(false);
  };

  // Auto-generate when meaningful data is present
  useEffect(() => {
    if (total > 0) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-600">
            Module 3
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-brand-ink">AI-Based Recommendation System</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Personalized eco-friendly alternatives generated from your live emissions data to maximise reduction impact.
          </p>
        </div>
        <button
          onClick={() => void generate()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
          {loading ? 'Generating…' : 'Regenerate'}
        </button>
      </div>

      {/* Context banner */}
      {total > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-violet-700">
            <span className="font-bold">{total.toFixed(1)} tCO₂e</span>
            <span className="text-violet-400">total</span>
          </div>
          <span className="h-4 w-px bg-violet-200" />
          <div className="flex items-center gap-2 text-sm text-violet-700">
            <span className="font-bold">{scope1.toFixed(1)} t</span>
            <span className="text-violet-400">Scope 1</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-violet-700">
            <span className="font-bold">{s2.toFixed(1)} t</span>
            <span className="text-violet-400">Scope 2</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-violet-700">
            <span className="font-bold">{scope3.toFixed(1)} t</span>
            <span className="text-violet-400">Scope 3</span>
          </div>
          {source && (
            <span className="ml-auto rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-600">
              {source === 'ai' ? '✦ Gemini AI' : '⚙ Rule-based'}
            </span>
          )}
        </div>
      )}

      {/* No data state */}
      {total === 0 && !loading && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <p className="text-slate-500 font-semibold text-sm">Add emissions data first</p>
          <p className="text-slate-300 text-xs mt-1">Go to Activity-Based Carbon Tracking → enter your Scope 1, 2 or 3 data, then come back here.</p>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Recommendation cards */}
      {!loading && recs.length > 0 && (
        <div className="space-y-3">
          {recs.map(rec => <RecommendationCard key={rec.id} rec={rec} />)}
        </div>
      )}

      {/* Disclaimer */}
      {!loading && recs.length > 0 && (
        <p className="text-center text-xs text-slate-300">
          {source === 'ai' ? 'Recommendations generated by Google Gemini AI based on your live emissions data.' : 'Recommendations generated by BCX rule engine. Add a Gemini API key for AI-powered suggestions.'}
        </p>
      )}
    </div>
  );
};
