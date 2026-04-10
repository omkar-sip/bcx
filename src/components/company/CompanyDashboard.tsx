import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useToast } from '../../hooks/useToast';
import { useCompanyStore } from '../../store/companyStore';
import type { UserProfile } from '../../types';
import { MetricCard } from '../shared/MetricCard';
import { Tabs } from '../shared/Tabs';
import { BCXIndexCard } from './BCXIndexCard';
import { Marketplace } from './Marketplace';
import { TransactionHistory } from './TransactionHistory';

interface CompanyDashboardProps {
  profile: UserProfile;
}

export const CompanyDashboard = ({ profile }: CompanyDashboardProps) => {
  const { pushToast } = useToast();
  const [tab, setTab] = useState<'overview' | 'marketplace' | 'transactions'>('overview');

  const {
    employees,
    bcxIndex,
    creditsPurchased,
    transactions,
    marketplace,
    totalScore,
    employeeCount,
    fetchCompanyData,
    buyCredits
  } = useCompanyStore(
    useShallow((state) => ({
      employees: state.employees,
      bcxIndex: state.bcxIndex,
      creditsPurchased: state.creditsPurchased,
      transactions: state.transactions,
      marketplace: state.marketplace,
      totalScore: state.totalScore,
      employeeCount: state.employeeCount,
      fetchCompanyData: state.fetchCompanyData,
      buyCredits: state.buyCredits
    }))
  );

  useEffect(() => {
    void fetchCompanyData(profile.uid, profile.company);
  }, [fetchCompanyData, profile.company, profile.uid]);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-slate-500">Company dashboard</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">
          {profile.name}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="BCX index" value={bcxIndex} accent="orange" icon="BX" />
        <MetricCard label="Total team score" value={totalScore} accent="blue" icon="TS" />
        <MetricCard label="Employees" value={employeeCount} accent="green" icon="EM" />
        <MetricCard label="Credits purchased" value={creditsPurchased} accent="amber" icon="CR" />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <Tabs
          items={[
            { id: 'overview', label: 'Overview' },
            { id: 'marketplace', label: 'Marketplace' },
            { id: 'transactions', label: 'Transactions' }
          ]}
          activeId={tab}
          onChange={(value) => setTab(value as typeof tab)}
        />

        {tab === 'overview' ? (
          <div className="space-y-4">
            <BCXIndexCard index={bcxIndex} employeeCount={employeeCount} totalScore={totalScore} />
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                Employee leaderboard
              </h2>
              <div className="mt-3 space-y-2">
                {employees.map((row, index) => (
                  <article
                    key={row.uid}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                  >
                    <p className="text-sm font-semibold text-brand-ink">
                      #{index + 1} {row.name}
                    </p>
                    <p className="font-mono text-xs text-slate-600">{row.score} pts</p>
                  </article>
                ))}
                {!employees.length ? (
                  <p className="text-sm text-slate-500">No employees linked yet.</p>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {tab === 'marketplace' ? (
          <Marketplace
            listings={marketplace}
            onBuy={(farmerId, credits) => {
              void buyCredits(profile.uid, profile.company, farmerId, credits).then((result) => {
                pushToast(result.message, result.ok ? 'success' : 'error');
              });
            }}
          />
        ) : null}

        {tab === 'transactions' ? <TransactionHistory transactions={transactions} /> : null}
      </div>
    </section>
  );
};
