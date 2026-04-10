import { formatCompactDate, formatPercent, formatTonnes } from '../../lib/utils';
import type { CompanyEmployeeRow } from '../../store/companyStore';
import type { EmployeeProgramMetrics } from '../../types';

interface EmployeeProgramPulseProps {
  metrics: EmployeeProgramMetrics;
  employees: CompanyEmployeeRow[];
}

export const EmployeeProgramPulse = ({ metrics, employees }: EmployeeProgramPulseProps) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
        Employee Program Pulse
      </p>
      <p className="mt-2 text-sm text-slate-600">
        The commute and behavior signal coming from employees now influences Scope 3 confidence.
      </p>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <article className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Participation
        </p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-ink">
          {formatPercent(metrics.participationRate)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {metrics.activeEmployees} active employees from the current team this week.
        </p>
      </article>
      <article className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Scope 3 reduction signal
        </p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-ink">
          {formatTonnes(metrics.commuteReductionTonnes, 2)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Net commute improvement inferred from logged behavior so far.
        </p>
      </article>
      <article className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Positive action ratio
        </p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-ink">
          {formatPercent(metrics.positiveActionRate)}
        </p>
        <p className="mt-2 text-sm text-slate-600">{metrics.totalActions} total actions in the live ledger.</p>
      </article>
      <article className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Dominant behavior
        </p>
        <p className="mt-2 text-lg font-bold text-brand-ink">{metrics.dominantAction}</p>
        <p className="mt-2 text-sm text-slate-600">
          Last update{' '}
          {metrics.latestActionAt ? formatCompactDate(metrics.latestActionAt) : 'not available'}
        </p>
      </article>
    </div>

    <div className="mt-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-brand-ink">Top contributors</p>
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">By eco score</p>
      </div>
      <div className="mt-3 space-y-2">
        {employees.slice(0, 3).map((employee, index) => (
          <article
            key={employee.uid}
            className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-brand-ink">
                #{index + 1} {employee.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {employee.lastActionAt ? formatCompactDate(employee.lastActionAt) : 'No recent activity'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs font-semibold text-slate-700">{employee.score} pts</p>
              <p className="mt-1 font-mono text-[11px] text-slate-500">
                {formatTonnes(Math.max(0, employee.recentImpactTonnes), 2)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
