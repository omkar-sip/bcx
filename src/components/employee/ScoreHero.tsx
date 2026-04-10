import { formatKg } from '../../lib/utils';

interface ScoreHeroProps {
  score: number;
  rank: number;
  company: string | null;
  impactKg: number;
  dominantAction: string;
}

export const ScoreHero = ({
  score,
  rank,
  company,
  impactKg,
  dominantAction
}: ScoreHeroProps) => (
  <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-orange to-orange-400 p-6 text-white shadow-float">
    <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15 blur-sm" />
    <div className="absolute -bottom-14 left-0 h-40 w-40 rounded-full bg-white/10 blur-sm" />
    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-100">
          Employee impact
        </p>
        <h2 className="mt-2 text-2xl font-extrabold">
          Your actions now feed the company&apos;s Scope 3 signal
        </h2>
        <p className="mt-2 text-sm text-orange-50">
          Rank #{rank} {company ? `in ${company}` : 'across your team'} with {formatKg(impactKg)} of
          estimated carbon impact avoided so far.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            Strongest habit: {dominantAction}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            Better logging = better company decisions
          </span>
        </div>
      </div>

      <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-white/35 bg-white/15">
        <div className="text-center">
          <p className="text-3xl font-extrabold leading-none">{score}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-orange-100">
            score
          </p>
        </div>
      </div>
    </div>
  </section>
);
