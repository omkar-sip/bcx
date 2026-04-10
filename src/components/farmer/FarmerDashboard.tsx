import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../lib/utils';
import { useFarmerStore } from '../../store/farmerStore';
import type { UserProfile } from '../../types';
import { MetricCard } from '../shared/MetricCard';
import { Tabs } from '../shared/Tabs';
import { CreditGenerator } from './CreditGenerator';
import { FarmerHero } from './FarmerHero';
import { SaleHistory } from './SaleHistory';
import { SolarCalculator } from './SolarCalculator';

interface FarmerDashboardProps {
  profile: UserProfile;
}

export const FarmerDashboard = ({ profile }: FarmerDashboardProps) => {
  const { pushToast } = useToast();
  const [tab, setTab] = useState<'generate' | 'solar' | 'history'>('generate');
  const {
    availableCredits,
    soldCredits,
    earnings,
    saleHistory,
    fetchFarmerData,
    generateCredits,
    solarEstimate
  } = useFarmerStore(
    useShallow((state) => ({
      availableCredits: state.availableCredits,
      soldCredits: state.soldCredits,
      earnings: state.earnings,
      saleHistory: state.saleHistory,
      fetchFarmerData: state.fetchFarmerData,
      generateCredits: state.generateCredits,
      solarEstimate: state.solarEstimate
    }))
  );

  useEffect(() => {
    void fetchFarmerData(profile.uid);
  }, [fetchFarmerData, profile.uid]);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-slate-500">Farmer dashboard</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">
          Welcome, {profile.name}
        </h1>
      </header>

      <FarmerHero availableCredits={availableCredits} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Available credits" value={availableCredits} accent="green" icon="AV" />
        <MetricCard label="Sold credits" value={soldCredits} accent="orange" icon="SL" />
        <MetricCard label="Earnings" value={formatCurrency(earnings)} accent="blue" icon="ER" />
        <MetricCard label="Total transactions" value={saleHistory.length} accent="amber" icon="TX" />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <Tabs
          items={[
            { id: 'generate', label: 'Generate' },
            { id: 'solar', label: 'Solar' },
            { id: 'history', label: 'Sale History' }
          ]}
          activeId={tab}
          onChange={(value) => setTab(value as typeof tab)}
        />

        {tab === 'generate' ? (
          <CreditGenerator
            onGenerate={async (acres) => {
              const generated = await generateCredits(profile.uid, acres);
              pushToast(`Generated ${generated} tCO2 credits.`, 'success');
              return generated;
            }}
          />
        ) : null}

        {tab === 'solar' ? <SolarCalculator onEstimate={solarEstimate} /> : null}
        {tab === 'history' ? <SaleHistory sales={saleHistory} /> : null}
      </div>
    </section>
  );
};
