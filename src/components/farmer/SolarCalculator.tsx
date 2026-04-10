import { useState } from 'react';
import { formatCurrency } from '../../lib/utils';

interface SolarEstimate {
  dailyKwh: number;
  monthlyIncome: number;
  annualIncome: number;
}

interface SolarCalculatorProps {
  onEstimate: (acres: number) => SolarEstimate;
}

export const SolarCalculator = ({ onEstimate }: SolarCalculatorProps) => {
  const [acres, setAcres] = useState('');
  const [result, setResult] = useState<SolarEstimate | null>(null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
        Solar income estimator
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Estimate passive power revenue from unused acreage.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="field-input flex-1"
          type="number"
          min={1}
          placeholder="Unused land in acres"
          value={acres}
          onChange={(event) => setAcres(event.target.value)}
        />
        <button
          className="btn-secondary sm:w-auto"
          type="button"
          onClick={() => {
            const value = Number(acres);
            if (!value || value <= 0) {
              setResult(null);
              return;
            }
            setResult(onEstimate(value));
          }}
        >
          Calculate
        </button>
      </div>

      {result ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <p>Daily generation: {result.dailyKwh.toLocaleString('en-IN')} kWh</p>
          <p>Monthly income: {formatCurrency(result.monthlyIncome)}</p>
          <p>Annual potential: {formatCurrency(result.annualIncome)}</p>
        </div>
      ) : null}
    </section>
  );
};
