interface AIRecommendationsProps {
  recommendations: string[];
  loading: boolean;
}

export const AIRecommendations = ({ recommendations, loading }: AIRecommendationsProps) => (
  <div className="space-y-2">
    {loading ? <p className="text-sm text-slate-500">Generating recommendations...</p> : null}
    {!loading && !recommendations.length ? (
      <p className="text-sm text-slate-500">Log a few actions to get recommendations.</p>
    ) : null}
    {recommendations.map((item) => (
      <article
        key={item}
        className="rounded-xl border border-brand-orange/20 bg-brand-sand/50 px-3 py-2"
      >
        <p className="text-sm text-brand-ink">{item}</p>
      </article>
    ))}
  </div>
);
