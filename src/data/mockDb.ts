import type {
  AuthRecord,
  EcoAction,
  MockDatabase,
  Role,
  Transaction,
  UserProfile
} from '../types';

const DB_KEY = 'bcx_mock_db_v1';
const SESSION_KEY = 'bcx_active_email_v1';
const CREDIT_PRICE = 500;

const makeDate = (value: string) => new Date(value);

const action = (
  id: string,
  label: string,
  type: EcoAction['type'],
  pts: number,
  isoDate: string
): EcoAction => ({
  id,
  action: label,
  type,
  pts,
  timestamp: makeDate(isoDate)
});

const tx = (
  id: string,
  buyerId: string,
  sellerId: string,
  credits: number,
  amount: number,
  isoDate: string
): Transaction => ({
  id,
  buyerId,
  sellerId,
  credits,
  amount,
  timestamp: makeDate(isoDate)
});

const nowMinus = (hours: number) => new Date(Date.now() - hours * 3_600_000);

const profile = (
  uid: string,
  name: string,
  email: string,
  role: Role,
  company: string | null,
  createdAt: Date
): UserProfile => ({
  uid,
  name,
  email,
  role,
  company,
  createdAt
});

const cloneDate = (value: Date) => new Date(value.getTime());

const deepCopy = (db: MockDatabase): MockDatabase => ({
  accounts: Object.fromEntries(
    Object.entries(db.accounts).map(([email, record]) => [
      email,
      {
        password: record.password,
        profile: {
          ...record.profile,
          createdAt: cloneDate(record.profile.createdAt)
        }
      }
    ])
  ),
  employeeByUid: Object.fromEntries(
    Object.entries(db.employeeByUid).map(([uid, snapshot]) => [
      uid,
      {
        ...snapshot,
        actions: snapshot.actions.map((item) => ({
          ...item,
          timestamp: cloneDate(item.timestamp)
        }))
      }
    ])
  ),
  companyByUid: Object.fromEntries(
    Object.entries(db.companyByUid).map(([uid, snapshot]) => [
      uid,
      {
        ...snapshot,
        transactions: snapshot.transactions.map((item) => ({
          ...item,
          timestamp: cloneDate(item.timestamp)
        }))
      }
    ])
  ),
  farmerByUid: Object.fromEntries(
    Object.entries(db.farmerByUid).map(([uid, snapshot]) => [
      uid,
      {
        ...snapshot,
        saleHistory: snapshot.saleHistory.map((item) => ({
          ...item,
          timestamp: cloneDate(item.timestamp)
        }))
      }
    ])
  )
});

const seedDatabase = (): MockDatabase => {
  const created = new Date('2026-01-01T00:00:00.000Z');

  const accounts: Record<string, AuthRecord> = {
    'employee@bcx.io': {
      password: 'pass123',
      profile: profile(
        'emp_1',
        'Alex Green',
        'employee@bcx.io',
        'employee',
        'GreenTech Inc',
        created
      )
    },
    'company@bcx.io': {
      password: 'pass123',
      profile: profile(
        'co_1',
        'GreenTech Inc',
        'company@bcx.io',
        'company',
        'GreenTech Inc',
        created
      )
    },
    'farmer@bcx.io': {
      password: 'pass123',
      profile: profile(
        'farmer_1',
        'Ravi Kumar',
        'farmer@bcx.io',
        'farmer',
        null,
        created
      )
    },
    'emp2@bcx.io': {
      password: 'pass123',
      profile: profile(
        'emp_2',
        'Priya Sharma',
        'emp2@bcx.io',
        'employee',
        'GreenTech Inc',
        created
      )
    },
    'emp3@bcx.io': {
      password: 'pass123',
      profile: profile(
        'emp_3',
        'Sam Nair',
        'emp3@bcx.io',
        'employee',
        'GreenTech Inc',
        created
      )
    },
    'farmer2@bcx.io': {
      password: 'pass123',
      profile: profile(
        'farmer_2',
        'Meena Fields',
        'farmer2@bcx.io',
        'farmer',
        null,
        created
      )
    }
  };

  const employeeByUid = {
    emp_1: {
      score: 45,
      rank: 1,
      actions: [
        action('a_1', 'Cycled to work', 'bike', 15, '2026-04-09T09:12:00.000Z'),
        action(
          'a_2',
          'Saved electricity',
          'electricity',
          12,
          '2026-04-09T11:30:00.000Z'
        ),
        action(
          'a_3',
          'Public transport',
          'bus',
          10,
          '2026-04-08T11:00:00.000Z'
        ),
        action('a_4', 'Drove car', 'car', -5, '2026-04-08T09:00:00.000Z')
      ]
    },
    emp_2: {
      score: 62,
      rank: 1,
      actions: [action('a_5', 'Cycled to work', 'bike', 15, '2026-04-10T07:30:00.000Z')]
    },
    emp_3: {
      score: 31,
      rank: 1,
      actions: [action('a_6', 'Public transport', 'bus', 10, '2026-04-09T13:20:00.000Z')]
    }
  };

  const companyByUid = {
    co_1: {
      bcxIndex: 58,
      creditsPurchased: 12,
      employeeCount: 3,
      totalScore: 138,
      transactions: [
        tx('t_1', 'co_1', 'farmer_1', 5, 2_500, '2026-04-10T05:00:00.000Z'),
        tx('t_2', 'co_1', 'farmer_2', 7, 3_500, '2026-04-09T05:00:00.000Z')
      ]
    }
  };

  const farmerByUid = {
    farmer_1: {
      availableCredits: 28,
      soldCredits: 12,
      earnings: 6_000,
      saleHistory: [tx('ft_1', 'co_1', 'farmer_1', 5, 2_500, '2026-04-10T05:00:00.000Z')]
    },
    farmer_2: {
      availableCredits: 40,
      soldCredits: 7,
      earnings: 3_500,
      saleHistory: [tx('ft_2', 'co_1', 'farmer_2', 7, 3_500, '2026-04-09T05:00:00.000Z')]
    }
  };

  return {
    accounts,
    employeeByUid,
    companyByUid,
    farmerByUid
  };
};

const reviver = (_key: string, value: unknown) => {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed) && value.includes('T') && value.includes(':')) {
      return new Date(parsed);
    }
  }
  return value;
};

export const readDatabase = (): MockDatabase => {
  if (typeof window === 'undefined') {
    return seedDatabase();
  }

  const existing = localStorage.getItem(DB_KEY);
  if (!existing) {
    const seeded = seedDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return deepCopy(seeded);
  }

  try {
    const parsed = JSON.parse(existing, reviver) as MockDatabase;
    return deepCopy(parsed);
  } catch {
    const seeded = seedDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return deepCopy(seeded);
  }
};

export const writeDatabase = (db: MockDatabase): void => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const getCreditPrice = () => CREDIT_PRICE;

export const getSessionEmail = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(SESSION_KEY);
};

export const setSessionEmail = (email: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(SESSION_KEY, email);
};

export const clearSessionEmail = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(SESSION_KEY);
};

export const createId = (prefix: string): string =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const addMockTransaction = (
  buyerId: string,
  sellerId: string,
  credits: number
): Transaction => {
  const amount = credits * CREDIT_PRICE;
  return {
    id: createId('tx'),
    buyerId,
    sellerId,
    credits,
    amount,
    timestamp: nowMinus(0)
  };
};
