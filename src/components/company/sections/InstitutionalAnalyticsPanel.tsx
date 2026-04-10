/**
 * Institutional Analytics Panel – Module 5
 * Re-integrates BCXIndexCard, CompanyAlerts, EmployeeProgramPulse, and Marketplace
 * into the new sidebar-driven dashboard layout.
 */
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../../../store/authStore';
import { useCompanyStore } from '../../../store/companyStore';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatPercent, formatTonnes } from '../../../lib/utils';
import { BCXIndexCard } from '../BCXIndexCard';
import { CompanyAlerts } from '../CompanyAlerts';
import { EmployeeProgramPulse } from '../EmployeeProgramPulse';
import { Marketplace } from '../Marketplace';
import { cx } from '../../../lib/utils';

const MetricTile = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: 'orange' | 'blue' | 'green' | 'amber';
}) => {
  const colors: Record<string, string> = {
    orange: 'text-brand-orange',
    blue: 'text-blue-500',
    green: 'text-emerald-500',
    amber: 'text-amber-500',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={cx('mt-2 text-2xl font-extrabold', colors[accent])}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
};

export const InstitutionalAnalyticsPanel = () => {
  const { pushToast } = useToast();
  const userProfile = useAuthStore((s) => s.userProfile);

  const {
    bcxIndex,
    baselineEmissions,
    grossEmissions,
    netEmissions,
    netZeroTargetYear,
    dominantScope,
    indexBreakdown,
    alerts,
    employeeProgram,
    employees,
    employeeCount,
    creditsPurchased,
    marketplace,
    offsetPlan,
    renewableShare,
    scopeMetrics,
    fetchCompanyData,
    buyCredits,
  } = useCompanyStore(
    useShallow((s) => ({
      bcxIndex: s.bcxIndex,
      baselineEmissions: s.baselineEmissions,
      grossEmissions: s.grossEmissions,
      netEmissions: s.netEmissions,
      netZeroTargetYear: s.netZeroTargetYear,
      dominantScope: s.dominantScope,
      indexBreakdown: s.indexBreakdown,
      alerts: s.alerts,
      employeeProgram: s.employeeProgram,
      employees: s.employees,
      employeeCount: s.employeeCount,
      creditsPurchased: s.creditsPurchased,
      marketplace: s.marketplace,
      offsetPlan: s.offsetPlan,
      renewableShare: s.renewableShare,
      scopeMetrics: s.scopeMetrics,
      fetchCompanyData: s.fetchCompanyData,
      buyCredits: s.buyCredits,
    }))
  );

  useEffect(() => {
    if (userProfile) {
      void fetchCompanyData(userProfile.uid, userProfile.company);
    }
  }, [fetchCompanyData, userProfile]);

  const statusColor: Record<string, string> = {
    critical: 'text-rose-500',
    watch: 'text-amber-500',
    healthy: 'text-emerald-500',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Module 5
        </span>
        <h2 className="mt-2 text-xl font-extrabold text-brand-ink">Institutional Analytics Panel</h2>
        <p className="mt-1 max-w-xl text-sm text-slate-500">
          Monitor your organization's full environmental impact — emissions performance, offset position, employee program health, and live carbon market.
        </p>
      </div>

      {/* BCX Index (top composite score) */}
      <BCXIndexCard
        index={bcxIndex}
        baselineEmissions={baselineEmissions}
        grossEmissions={grossEmissions}
        netEmissions={netEmissions}
        targetYear={netZeroTargetYear}
        dominantScopeLabel={dominantScope?.label ?? 'the current inventory'}
        breakdown={indexBreakdown}
      />

      {/* KPIs row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricTile
          label="Gross Emissions"
          value={formatTonnes(grossEmissions)}
          sub={`Baseline ${formatTonnes(baselineEmissions)}`}
          accent="orange"
        />
        <MetricTile
          label="Net Emissions"
          value={formatTonnes(netEmissions)}
          sub={`After ${creditsPurchased} credits`}
          accent="blue"
        />
        <MetricTile
          label="Offset Coverage"
          value={formatPercent(offsetPlan.coverageRate)}
          sub={`Target ${formatPercent(offsetPlan.targetCoverageRate)}`}
          accent="green"
        />
        <MetricTile
          label="Renewable Share"
          value={formatPercent(renewableShare)}
          sub="Of electricity consumed"
          accent="amber"
        />
      </div>

      {/* Scope distribution */}
      {scopeMetrics.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-brand-ink mb-4">Scope Distribution</p>
          <div className="space-y-4">
            {scopeMetrics.map((scope) => (
              <div key={scope.id} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cx('font-bold', statusColor[scope.status])}>{scope.label}</span>
                    <span className="text-slate-400">{scope.driver}</span>
                  </div>
                  <span className="font-bold text-brand-ink">{formatTonnes(scope.tonnes)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cx(
                      'h-full rounded-full transition-all duration-500',
                      scope.status === 'critical'
                        ? 'bg-rose-400'
                        : scope.status === 'watch'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    )}
                    style={{ width: `${Math.round(scope.share * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">{scope.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Alerts */}
      <CompanyAlerts alerts={alerts} />

      {/* Employee Program */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-brand-ink">Employee Program Health</p>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            {employeeCount} employees
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Commute and behavior signals from employees feed directly into Scope 3 confidence.
        </p>
        <EmployeeProgramPulse metrics={employeeProgram} employees={employees} />
      </div>

      {/* Carbon credit marketplace */}
      {marketplace.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-brand-ink">Carbon Credit Marketplace</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified farmer listings — {marketplace.length} active suppliers
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                Target: <span className="font-bold text-brand-orange">{offsetPlan.creditsNeededForTarget}t</span> to reach {formatPercent(offsetPlan.targetCoverageRate)} coverage
              </span>
            </div>
          </div>
          {userProfile && (
            <Marketplace
              listings={marketplace}
              creditsToNeutralize={offsetPlan.creditsNeededForNeutrality}
              onBuy={(farmerId, credits) => {
                void buyCredits(userProfile.uid, userProfile.company, farmerId, credits).then((result) => {
                  pushToast(result.message, result.ok ? 'success' : 'error');
                });
              }}
            />
          )}
        </div>
      )}

      {/* Offset budget */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Neutralisation Budget</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-orange">
            {formatCurrency(offsetPlan.estimatedBudgetToNeutralize)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Avg {formatCurrency(offsetPlan.averagePrice)}/t · {offsetPlan.creditsNeededForNeutrality}t needed
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Market Liquidity</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-500">
            {formatTonnes(offsetPlan.marketLiquidityTonnes)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Live farmer-side supply available</p>
        </div>
      </div>
    </div>
  );
};
