interface ScoreHeroProps {
  score: number;
  rank: number;
  company: string | null;
}

export const ScoreHero = ({ score, rank, company }: ScoreHeroProps) => (
  <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-orange to-orange-400 p-6 text-white shadow-float">
    <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15 blur-sm" />
    <div className="absolute -bottom-14 left-0 h-40 w-40 rounded-full bg-white/10 blur-sm" />
    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-100">
          Personal impact
        </p>
        <h2 className="mt-2 text-2xl font-extrabold">Your sustainability momentum</h2>
        <p className="mt-2 text-sm text-orange-50">
          Rank #{rank} {company ? `in ${company}` : 'across your team'}
        </p>
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
