import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getAIRecommendations } from '../../lib/gemini';
import { useToast } from '../../hooks/useToast';
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

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-slate-500">Employee dashboard</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">
          Hello, {profile.name.split(' ')[0]}
        </h1>
      </header>

      <ScoreHero score={score} rank={rank} company={profile.company} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total score" value={score} icon="SC" accent="orange" />
        <MetricCard label="Company rank" value={`#${rank}`} icon="RK" accent="blue" />
        <MetricCard label="Actions logged" value={actions.length} icon="AC" accent="green" />
        <MetricCard
          label="Average points"
          value={actions.length ? Math.round(score / actions.length) : 0}
          icon="AV"
          accent="amber"
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <Tabs
          items={[
            { id: 'actions', label: 'Quick Actions' },
            { id: 'leaderboard', label: 'Leaderboard' },
            { id: 'history', label: 'Action History' }
          ]}
          activeId={tab}
          onChange={(value) => setTab(value as typeof tab)}
        />

        {tab === 'actions' ? (
          <ActionGrid
            onLog={(actionLabel, type, pts) => {
              void logAction(profile.uid, profile.company, actionLabel, type, pts);
              pushToast(
                `${pts >= 0 ? '+' : ''}${pts} pts — ${actionLabel}`,
                pts >= 0 ? 'success' : 'info'
              );
            }}
          />
        ) : null}

        {tab === 'leaderboard' ? <Leaderboard rows={leaderboard} /> : null}
        {tab === 'history' ? <ActionHistory actions={actions} /> : null}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
          AI Recommendations
        </h2>
        <div className="mt-3">
          <AIRecommendations
            recommendations={recommendations}
            loading={recommendationsLoading}
          />
        </div>
      </section>
    </section>
  );
};
