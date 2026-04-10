interface FarmerHeroProps {
  availableCredits: number;
}

export const FarmerHero = ({ availableCredits }: FarmerHeroProps) => (
  <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-400 p-6 text-white shadow-float">
    <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/20 blur-sm" />
    <div className="absolute -bottom-10 left-6 h-28 w-28 rounded-full bg-white/15 blur-sm" />
    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-100">
          Farmer marketplace
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Your live credit inventory</h2>
      </div>
      <p className="text-3xl font-extrabold">{availableCredits} tCO2</p>
    </div>
  </section>
);
