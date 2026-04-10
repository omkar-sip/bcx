import { create } from 'zustand';
import {
  addMockTransaction,
  getCreditPrice,
  readDatabase,
  writeDatabase
} from '../data/mockDb';
import type { MarketplaceCredit, Transaction } from '../types';

interface CompanyEmployeeRow {
  uid: string;
  name: string;
  score: number;
}

interface CompanyStoreState {
  employees: CompanyEmployeeRow[];
  bcxIndex: number;
  creditsPurchased: number;
  transactions: Transaction[];
  marketplace: MarketplaceCredit[];
  totalScore: number;
  employeeCount: number;
  loading: boolean;
  fetchCompanyData: (companyUid: string, companyName: string | null) => Promise<void>;
  buyCredits: (
    companyUid: string,
    companyName: string | null,
    farmerId: string,
    credits: number
  ) => Promise<{ ok: boolean; message: string }>;
}

const buildMarketplace = (): MarketplaceCredit[] => {
  const db = readDatabase();
  const farmerProfiles = Object.values(db.accounts).filter(
    (item) => item.profile.role === 'farmer'
  );

  return farmerProfiles
    .map((item) => {
      const farmerState = db.farmerByUid[item.profile.uid];
      return {
        farmerId: item.profile.uid,
        farmerName: item.profile.name,
        tonnesAvailable: farmerState?.availableCredits ?? 0,
        pricePerTonne: getCreditPrice()
      };
    })
    .filter((item) => item.tonnesAvailable > 0)
    .sort((a, b) => b.tonnesAvailable - a.tonnesAvailable);
};

const calculateCompanyMetrics = (
  companyUid: string,
  companyName: string | null
): {
  employees: CompanyEmployeeRow[];
  totalScore: number;
  employeeCount: number;
  bcxIndex: number;
  creditsPurchased: number;
  transactions: Transaction[];
} => {
  const db = readDatabase();
  const employees = Object.values(db.accounts)
    .filter(
      (item) =>
        item.profile.role === 'employee' &&
        companyName &&
        item.profile.company === companyName
    )
    .map((item) => ({
      uid: item.profile.uid,
      name: item.profile.name,
      score: db.employeeByUid[item.profile.uid]?.score ?? 0
    }))
    .sort((a, b) => b.score - a.score);

  const totalScore = employees.reduce((sum, row) => sum + row.score, 0);
  const employeeCount = employees.length;
  const average = employeeCount ? totalScore / employeeCount : 0;
  const companyState = db.companyByUid[companyUid] ?? {
    bcxIndex: 0,
    creditsPurchased: 0,
    transactions: [],
    employeeCount: 0,
    totalScore: 0
  };
  const bcxIndex = Math.min(
    100,
    Math.round(average * 0.5 + employeeCount * 3 + companyState.creditsPurchased * 1.5)
  );

  db.companyByUid[companyUid] = {
    ...companyState,
    bcxIndex,
    totalScore,
    employeeCount
  };
  writeDatabase(db);

  return {
    employees,
    totalScore,
    employeeCount,
    bcxIndex,
    creditsPurchased: companyState.creditsPurchased,
    transactions: companyState.transactions
  };
};

export const useCompanyStore = create<CompanyStoreState>((set) => ({
  employees: [],
  bcxIndex: 0,
  creditsPurchased: 0,
  transactions: [],
  marketplace: [],
  totalScore: 0,
  employeeCount: 0,
  loading: false,
  fetchCompanyData: async (companyUid, companyName) => {
    set({ loading: true });
    const metrics = calculateCompanyMetrics(companyUid, companyName);
    set({
      ...metrics,
      marketplace: buildMarketplace(),
      transactions: metrics.transactions.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ),
      loading: false
    });
  },
  buyCredits: async (companyUid, companyName, farmerId, credits) => {
    const db = readDatabase();
    const farmerState = db.farmerByUid[farmerId];
    if (!farmerState) {
      return { ok: false, message: 'Farmer not found.' };
    }
    if (credits <= 0) {
      return { ok: false, message: 'Credits should be greater than zero.' };
    }
    if (farmerState.availableCredits < credits) {
      return { ok: false, message: 'Requested credits exceed availability.' };
    }

    const transaction = addMockTransaction(companyUid, farmerId, credits);
    const companyState = db.companyByUid[companyUid] ?? {
      bcxIndex: 0,
      creditsPurchased: 0,
      transactions: [],
      employeeCount: 0,
      totalScore: 0
    };

    db.companyByUid[companyUid] = {
      ...companyState,
      creditsPurchased: companyState.creditsPurchased + credits,
      transactions: [transaction, ...companyState.transactions]
    };

    db.farmerByUid[farmerId] = {
      ...farmerState,
      availableCredits: farmerState.availableCredits - credits,
      soldCredits: farmerState.soldCredits + credits,
      earnings: farmerState.earnings + transaction.amount,
      saleHistory: [transaction, ...farmerState.saleHistory]
    };

    writeDatabase(db);
    await useCompanyStore.getState().fetchCompanyData(companyUid, companyName);
    return {
      ok: true,
      message: `Purchased ${credits}t carbon credits for INR ${transaction.amount.toLocaleString(
        'en-IN'
      )}.`
    };
  }
}));
