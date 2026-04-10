import { create } from 'zustand';
import { createId, readDatabase, writeDatabase } from '../data/mockDb';
import type { Transaction } from '../types';

interface SolarEstimate {
  dailyKwh: number;
  monthlyIncome: number;
  annualIncome: number;
}

interface FarmerStoreState {
  availableCredits: number;
  soldCredits: number;
  earnings: number;
  saleHistory: Transaction[];
  loading: boolean;
  fetchFarmerData: (uid: string) => Promise<void>;
  generateCredits: (uid: string, acres: number) => Promise<number>;
  solarEstimate: (acres: number) => SolarEstimate;
}

export const useFarmerStore = create<FarmerStoreState>((set) => ({
  availableCredits: 0,
  soldCredits: 0,
  earnings: 0,
  saleHistory: [],
  loading: false,
  fetchFarmerData: async (uid) => {
    set({ loading: true });
    const db = readDatabase();
    const snapshot = db.farmerByUid[uid] ?? {
      availableCredits: 0,
      soldCredits: 0,
      earnings: 0,
      saleHistory: []
    };
    set({
      availableCredits: snapshot.availableCredits,
      soldCredits: snapshot.soldCredits,
      earnings: snapshot.earnings,
      saleHistory: snapshot.saleHistory.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ),
      loading: false
    });
  },
  generateCredits: async (uid, acres) => {
    const normalizedAcres = Math.max(0, acres);
    const generated = Math.round(normalizedAcres * 2.5);

    const db = readDatabase();
    const current = db.farmerByUid[uid] ?? {
      availableCredits: 0,
      soldCredits: 0,
      earnings: 0,
      saleHistory: []
    };
    db.farmerByUid[uid] = {
      ...current,
      availableCredits: current.availableCredits + generated,
      saleHistory: [
        {
          id: createId('gen'),
          buyerId: uid,
          sellerId: uid,
          credits: generated,
          amount: 0,
          timestamp: new Date()
        },
        ...current.saleHistory
      ]
    };
    writeDatabase(db);
    await useFarmerStore.getState().fetchFarmerData(uid);
    return generated;
  },
  solarEstimate: (acres) => {
    const normalizedAcres = Math.max(0, acres);
    const dailyKwh = Math.round(normalizedAcres * 400 * 0.4 * 5);
    const monthlyIncome = Math.round(dailyKwh * 3.5 * 30);
    const annualIncome = monthlyIncome * 12;
    return { dailyKwh, monthlyIncome, annualIncome };
  }
}));
