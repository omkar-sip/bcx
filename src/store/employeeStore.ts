import { create } from 'zustand';
import { createDefaultCompanySnapshot, createId, readDatabase, writeDatabase } from '../data/mockDb';
import type { EcoAction } from '../types';

export interface EmployeeLeaderboardRow {
  uid: string;
  name: string;
  score: number;
  isCurrentUser: boolean;
}

interface EmployeeStoreState {
  actions: EcoAction[];
  score: number;
  rank: number;
  leaderboard: EmployeeLeaderboardRow[];
  loading: boolean;
  fetchActions: (uid: string, companyName: string | null) => Promise<void>;
  logAction: (
    uid: string,
    companyName: string | null,
    actionLabel: string,
    type: EcoAction['type'],
    pts: number
  ) => Promise<void>;
}

const sortedLeaderboard = (companyName: string | null, currentUid: string) => {
  const db = readDatabase();
  const peers = Object.values(db.accounts)
    .filter(
      (item) =>
        item.profile.role === 'employee' &&
        item.profile.company &&
        companyName &&
        item.profile.company === companyName
    )
    .map((item) => ({
      uid: item.profile.uid,
      name: item.profile.name,
      score: db.employeeByUid[item.profile.uid]?.score ?? 0,
      isCurrentUser: item.profile.uid === currentUid
    }))
    .sort((a, b) => b.score - a.score);

  return peers.map((row, index) => ({ ...row, rank: index + 1 }));
};

const recomputeCompanyAggregates = (companyName: string | null) => {
  if (!companyName) {
    return;
  }

  const db = readDatabase();
  const companyAccount = Object.values(db.accounts).find(
    (item) => item.profile.role === 'company' && item.profile.company === companyName
  );
  if (!companyAccount) {
    return;
  }

  const employees = Object.values(db.accounts).filter(
    (item) => item.profile.role === 'employee' && item.profile.company === companyName
  );
  const scores = employees.map((item) => db.employeeByUid[item.profile.uid]?.score ?? 0);
  const totalScore = scores.reduce((sum, value) => sum + value, 0);
  const employeeCount = employees.length;
  const existing = createDefaultCompanySnapshot(db.companyByUid[companyAccount.profile.uid] ?? {});

  db.companyByUid[companyAccount.profile.uid] = {
    ...existing,
    bcxIndex: existing.bcxIndex,
    employeeCount,
    totalScore,
    transactions: existing.transactions
  };

  writeDatabase(db);
};

export const useEmployeeStore = create<EmployeeStoreState>((set) => ({
  actions: [],
  score: 0,
  rank: 1,
  leaderboard: [],
  loading: false,
  fetchActions: async (uid, companyName) => {
    set({ loading: true });
    const db = readDatabase();
    const snapshot = db.employeeByUid[uid] ?? { actions: [], score: 0, rank: 1 };
    const leaderboardWithRank = sortedLeaderboard(companyName, uid);
    const currentRank =
      leaderboardWithRank.find((item) => item.uid === uid)?.rank ?? snapshot.rank ?? 1;

    set({
      actions: snapshot.actions.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ),
      score: snapshot.score,
      rank: currentRank,
      leaderboard: leaderboardWithRank.map(({ rank: _rank, ...item }) => item),
      loading: false
    });
  },
  logAction: async (uid, companyName, actionLabel, type, pts) => {
    const db = readDatabase();
    const current = db.employeeByUid[uid] ?? { actions: [], score: 0, rank: 1 };
    const nextAction: EcoAction = {
      id: createId('act'),
      action: actionLabel,
      type,
      pts,
      timestamp: new Date()
    };

    db.employeeByUid[uid] = {
      ...current,
      score: Math.max(0, current.score + pts),
      actions: [nextAction, ...current.actions]
    };
    writeDatabase(db);
    recomputeCompanyAggregates(companyName);
    await useEmployeeStore.getState().fetchActions(uid, companyName);
  }
}));
