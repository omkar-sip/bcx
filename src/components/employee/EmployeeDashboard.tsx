import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  getCommuteImpactTonnes,
  getDominantActionLabel,
  getNetActionImpactTonnes,
  getPositiveActionRate
} from '../../lib/carbon';
import { getAIRecommendations } from '../../lib/gemini';
import { useToast } from '../../hooks/useToast';
import { formatKg, formatPercent, formatTonnes } from '../../lib/utils';
import { useEmployeeStore } from '../../store/employeeStore';
import type { UserProfile } from '../../types';
import { ActionGrid } from './ActionGrid';
import { ActionHistory } from './ActionHistory';
import { AIRecommendations } from './AIRecommendations';
import { Leaderboard } from './Leaderboard';
import { ScoreHero } from './ScoreHero';
import { MetricCard } from '../shared/MetricCard';
import { Tabs } from '../shared/Tabs';

interface EmployeeDashboardProps {
  profile: UserProfile;
}

export const EmployeeDashboard = ({ profile }: EmployeeDashboardProps) => {
  const { pushToast } = useToast();
  const [tab, setTab] = useState<'actions' | 'leaderboard' | 'history'>('actions');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const { actions, score, rank, leaderboard, fetchActions, logAction } = useEmployeeStore(
    useShallow((state) => ({
      actions: state.actions,
      score: state.score,
      rank: state.rank,
      leaderboard: state.leaderboard,
      fetchActions: state.fetchActions,
      logAction: state.logAction
    }))
  );

  useEffect(() => {
    void fetchActions(profile.uid, profile.company);
  }, [fetchActions, profile.company, profile.uid]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setRecommendationsLoading(true);
      const tips = await getAIRecommendations(actions);
      if (active) {
        setRecommendations(tips);
        setRecommendationsLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [actions]);

  const netImpactTonnes = Math.max(0, getNetActionImpactTonnes(actions));
  const commuteImpactTonnes = Math.max(0, getCommuteImpactTonnes(actions));
  const dominantAction = getDominantActionLabel(actions);
  const positiveActionRate = getPositiveActionRate(actions);
  const leaderScore = leaderboard[0]?.score ?? score;
  const gapToLeader = Math.max(0, leaderScore - score);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-slate-500">Employee dashboard</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">
          Hello, {profile.name.split(' ')[0]}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          BCX uses your logged choices to strengthen company-level Scope 3 reporting. Honest,
          frequent inputs are more valuable than inflated points because they improve real decision
          quality upstream.
        </p>
      </header>

      <ScoreHero
        score={score}
        rank={rank}
        company={profile.company}
        impactKg={netImpactTonnes * 1000}
        dominantAction={dominantAction}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Estimated impact avoided"
          value={formatKg(netImpactTonnes * 1000)}
          icon="KG"
          accent="orange"
          hint="Net effect from logged actions"
        />
        <MetricCard
          label="Company rank"
          value={`#${rank}`}
          icon="RK"
          accent="blue"
          hint={gapToLeader ? `${gapToLeader} pts behind the leader` : 'You are leading the team'}
        />
        <MetricCard
          label="Positive action ratio"
          value={formatPercent(positiveActionRate)}
          icon="PR"
          accent="green"
          hint="Higher ratios improve data confidence"
        />
        <MetricCard
          label="Commute reduction signal"
          value={formatTonnes(commuteImpactTonnes, 2)}
          icon="S3"
          accent="amber"
          hint="Contribution feeding company Scope 3"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            Contribution Snapshot
          </p>
          <div className="mt-4 space-y-3">
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Dominant habit
              </p>
              <p className="mt-2 text-lg font-bold text-brand-ink">{dominantAction}</p>
              <p className="mt-2 text-sm text-slate-600">
                The more consistent your strongest habit becomes, the clearer the trend BCX can
                surface for the company.
              </p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Action logging discipline
              </p>
              <p className="mt-2 text-lg font-bold text-brand-ink">{actions.length} entries</p>
              <p className="mt-2 text-sm text-slate-600">
                Consistent logging matters more than perfect scores because missing data weakens the
                company&apos;s decision signal.
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            Next Best Actions
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Personalized prompts based on your recent behavior mix.
          </p>
          <div className="mt-4">
            <AIRecommendations
              recommendations={recommendations}
              loading={recommendationsLoading}
            />
          </div>
        </section>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <Tabs
          items={[
            { id: 'actions', label: 'Log Actions' },
            { id: 'leaderboard', label: 'Team View' },
            { id: 'history', label: 'History' }
          ]}
          activeId={tab}
          onChange={(value) => setTab(value as typeof tab)}
        />

        {tab === 'actions' ? (
          <ActionGrid
            onLog={(actionLabel, type, pts) => {
              void logAction(profile.uid, profile.company, actionLabel, type, pts);
              pushToast(
                `${pts >= 0 ? '+' : ''}${pts} pts | ${actionLabel}`,
                pts >= 0 ? 'success' : 'info'
              );
            }}
          />
        ) : null}

        {tab === 'leaderboard' ? <Leaderboard rows={leaderboard} /> : null}
        {tab === 'history' ? <ActionHistory actions={actions} /> : null}
      </div>
    </section>
  );
};
