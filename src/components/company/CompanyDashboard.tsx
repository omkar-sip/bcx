import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatPercent, formatTonnes } from '../../lib/utils';
import { useCompanyStore } from '../../store/companyStore';
import type { UserProfile } from '../../types';
import { MetricCard } from '../shared/MetricCard';
import { Tabs } from '../shared/Tabs';
import { BCXIndexCard } from './BCXIndexCard';
import { CompanyAlerts } from './CompanyAlerts';
import { EmployeeProgramPulse } from './EmployeeProgramPulse';
import { EmissionBreakdown } from './EmissionBreakdown';
import { Marketplace } from './Marketplace';
import { ReductionRoadmap } from './ReductionRoadmap';
import { TransactionHistory } from './TransactionHistory';

interface CompanyDashboardProps {
  profile: UserProfile;
}

export const CompanyDashboard = ({ profile }: CompanyDashboardProps) => {
  const { pushToast } = useToast();
  const [tab, setTab] = useState<'command' | 'market' | 'ledger'>('command');

  const {
    employees,
    bcxIndex,
    creditsPurchased,
    transactions,
    marketplace,
    totalScore,
    employeeCount,
    baselineEmissions,
    grossEmissions,
    netEmissions,
    scopeMetrics,
    dominantScope,
    alerts,
    initiatives,
    employeeProgram,
    offsetPlan,
    indexBreakdown,
    renewableShare,
    netZeroTargetYear,
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
      baselineEmissions: state.baselineEmissions,
      grossEmissions: state.grossEmissions,
      netEmissions: state.netEmissions,
      scopeMetrics: state.scopeMetrics,
      dominantScope: state.dominantScope,
      alerts: state.alerts,
      initiatives: state.initiatives,
      employeeProgram: state.employeeProgram,
      offsetPlan: state.offsetPlan,
      indexBreakdown: state.indexBreakdown,
      renewableShare: state.renewableShare,
      netZeroTargetYear: state.netZeroTargetYear,
      fetchCompanyData: state.fetchCompanyData,
      buyCredits: state.buyCredits
    }))
  );

  useEffect(() => {
    void fetchCompanyData(profile.uid, profile.company);
  }, [fetchCompanyData, profile.company, profile.uid]);

  const totalSpend = transactions.reduce((sum, item) => sum + item.amount, 0);
  const supplierCount = new Set(transactions.map((item) => item.sellerId)).size;
  const averageTicket = transactions.length ? Math.round(totalSpend / transactions.length) : 0;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Company dashboard</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">
            {profile.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            A company-first operating layer for carbon accounting, reduction planning, and rural
            credit procurement. This view is built to answer what matters next, not just what
            happened already.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft xl:max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            Carbon Strategy Brief
          </p>
          <p className="mt-3 text-lg font-bold text-brand-ink">
            {dominantScope
              ? `${dominantScope.label} is the operating bottleneck.`
              : 'Waiting for emissions data.'}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {dominantScope
              ? `${dominantScope.driver}. ${dominantScope.insight}`
              : 'Once data is available, BCX will prioritize the biggest emissions driver.'}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Next coverage milestone
              </p>
              <p className="mt-2 text-lg font-bold text-brand-ink">
                {offsetPlan.creditsNeededForTarget}t
              </p>
              <p className="mt-1 text-xs text-slate-500">
                To reach {formatPercent(offsetPlan.targetCoverageRate)}
              </p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Market liquidity
              </p>
              <p className="mt-2 text-lg font-bold text-brand-ink">
                {offsetPlan.marketLiquidityTonnes}t
              </p>
              <p className="mt-1 text-xs text-slate-500">Live farmer-side supply available</p>
            </article>
          </div>
        </section>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Gross emissions"
          value={formatTonnes(grossEmissions)}
          accent="orange"
          icon="GE"
          hint={`Baseline ${formatTonnes(baselineEmissions)}`}
        />
        <MetricCard
          label="Net emissions"
          value={formatTonnes(netEmissions)}
          accent="blue"
          icon="NE"
          hint={`After ${creditsPurchased} credits`}
        />
        <MetricCard
          label="Offset coverage"
          value={formatPercent(offsetPlan.coverageRate)}
          accent="green"
          icon="OF"
          hint={`${offsetPlan.creditsNeededForTarget}t to ${formatPercent(offsetPlan.targetCoverageRate)}`}
        />
        <MetricCard
          label="Neutralization budget"
          value={formatCurrency(offsetPlan.estimatedBudgetToNeutralize)}
          accent="amber"
          icon="INR"
          hint={`Avg ${formatCurrency(offsetPlan.averagePrice)}/t`}
        />
      </div>

      <CompanyAlerts alerts={alerts} />

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <Tabs
          items={[
            { id: 'command', label: 'Mission Control' },
            { id: 'market', label: 'Market Desk' },
            { id: 'ledger', label: 'Ledger' }
          ]}
          activeId={tab}
          onChange={(value) => setTab(value as typeof tab)}
        />

        {tab === 'command' ? (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <BCXIndexCard
                index={bcxIndex}
                baselineEmissions={baselineEmissions}
                grossEmissions={grossEmissions}
                netEmissions={netEmissions}
                targetYear={netZeroTargetYear}
                dominantScopeLabel={dominantScope?.label ?? 'the current inventory'}
                breakdown={indexBreakdown}
              />

              <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                  Analyst Notes
                </p>
                <div className="mt-4 space-y-4">
                  <article className="rounded-2xl bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Renewable coverage
                    </p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-ink">
                      {formatPercent(renewableShare)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      This is the fastest clean lever sitting inside the operating base.
                    </p>
                  </article>
                  <article className="rounded-2xl bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Employee coverage
                    </p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-ink">
                      {employeeCount} people
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {employeeProgram.totalActions} logged actions feeding live Scope 3 signals.
                    </p>
                  </article>
                  <article className="rounded-2xl bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Team momentum
                    </p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-ink">
                      {totalScore} pts
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Useful as a behavior proxy, but subordinate to emissions and offset math.
                    </p>
                  </article>
                </div>
              </section>
            </div>

            <EmissionBreakdown scopes={scopeMetrics} />

            <div className="grid gap-4 xl:grid-cols-2">
              <ReductionRoadmap initiatives={initiatives} />
              <EmployeeProgramPulse metrics={employeeProgram} employees={employees} />
            </div>
          </div>
        ) : null}

        {tab === 'market' ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Credits to 40% coverage"
                value={`${offsetPlan.creditsNeededForTarget}t`}
                accent="orange"
                icon="40"
                hint="Near-term board-ready threshold"
              />
              <MetricCard
                label="Credits to neutrality"
                value={`${offsetPlan.creditsNeededForNeutrality}t`}
                accent="blue"
                icon="NZ"
                hint="If you offset the full net position"
              />
              <MetricCard
                label="Average market price"
                value={formatCurrency(offsetPlan.averagePrice)}
                accent="green"
                icon="AP"
                hint="Weighted from live farmer listings"
              />
              <MetricCard
                label="Active suppliers"
                value={marketplace.length}
                accent="amber"
                icon="SP"
                hint="Verified farmer-side listings"
              />
            </div>

            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                Procurement Desk
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use credits to manage the residual gap, not to hide operational inertia. The market
                below is filtered for live rural supply with visible quality markers so finance and
                sustainability can make the trade-off together.
              </p>
            </section>

            <Marketplace
              listings={marketplace}
              creditsToNeutralize={offsetPlan.creditsNeededForNeutrality}
              onBuy={(farmerId, credits) => {
                void buyCredits(profile.uid, profile.company, farmerId, credits).then((result) => {
                  pushToast(result.message, result.ok ? 'success' : 'error');
                });
              }}
            />
          </div>
        ) : null}

        {tab === 'ledger' ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Credits purchased"
                value={`${creditsPurchased}t`}
                accent="orange"
                icon="CR"
                hint="Cumulative from farmer marketplace"
              />
              <MetricCard
                label="Capital deployed"
                value={formatCurrency(totalSpend)}
                accent="blue"
                icon="CD"
                hint="Total procurement spend"
              />
              <MetricCard
                label="Supplier count"
                value={supplierCount}
                accent="green"
                icon="SC"
                hint="Distinct farmer counterparties"
              />
              <MetricCard
                label="Average ticket"
                value={formatCurrency(averageTicket)}
                accent="amber"
                icon="AT"
                hint="Average credit purchase size"
              />
            </div>

            <TransactionHistory transactions={transactions} />
          </div>
        ) : null}
      </div>
    </section>
  );
};
