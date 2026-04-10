import { useState } from 'react';

interface CreditGeneratorProps {
  onGenerate: (acres: number) => Promise<number>;
}

export const CreditGenerator = ({ onGenerate }: CreditGeneratorProps) => {
  const [acres, setAcres] = useState('');
  const [generated, setGenerated] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
        Credit generator
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Estimate carbon credits from regenerative land use. Formula: 2.5 credits per acre.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="field-input flex-1"
          type="number"
          min={1}
          placeholder="Land size in acres"
          value={acres}
          onChange={(event) => setAcres(event.target.value)}
        />
        <button
          className="btn-primary sm:w-auto"
          type="button"
          disabled={loading}
          onClick={() => {
            const value = Number(acres);
            if (!value || value <= 0) {
              setGenerated(null);
              return;
            }
            setLoading(true);
            void onGenerate(value).then((result) => {
              setGenerated(result);
              setLoading(false);
            });
          }}
        >
          {loading ? 'Generating...' : 'Generate credits'}
        </button>
      </div>
      {generated !== null ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          +{generated} tCO2 added to inventory.
        </p>
      ) : null}
    </section>
  );
};
