import type {
  AuthRecord,
  CompanySnapshot,
  EcoAction,
  FarmerSnapshot,
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
  isoDate: string,
  buyerName?: string,
  sellerName?: string,
  pricePerTonne?: number
): Transaction => ({
  id,
  buyerId,
  sellerId,
  buyerName,
  sellerName,
  credits,
  amount,
  pricePerTonne,
  timestamp: makeDate(isoDate)
});

const nowMinus = (hours: number) => new Date(Date.now() - hours * 3_600_000);

const profile = (
  uid: string,
  name: string,
  email: string,
  role: Role,
  company: string | null,
  createdAt: Date,
  profileComplete = true,
  extra: Partial<UserProfile> = {}
): UserProfile => ({
  uid,
  name,
  email,
  role,
  company,
  profileComplete,
  createdAt,
  ...extra
});

const cloneDate = (value: Date) => new Date(value.getTime());

export const getCreditPrice = (priceMultiplier = 1): number =>
  Math.round(CREDIT_PRICE * priceMultiplier);

export const createDefaultCompanySnapshot = (
  overrides: Partial<CompanySnapshot> = {}
): CompanySnapshot => ({
  bcxIndex: 0,
  creditsPurchased: 0,
  transactions: [],
  employeeCount: 0,
  totalScore: 0,
  electricityKwh: 68_000,
  fuelLitres: 12_000,
  commuteBaselineTonnes: 18,
  renewableShare: 0.12,
  netZeroTargetYear: 2030,
  ...overrides
});

export const createDefaultFarmerSnapshot = (
  overrides: Partial<FarmerSnapshot> = {}
): FarmerSnapshot => ({
  availableCredits: 0,
  soldCredits: 0,
  earnings: 0,
  saleHistory: [],
  village: 'Unlisted village',
  methodology: 'Regenerative land management',
  certifications: [],
  verificationScore: 75,
  priceMultiplier: 1,
  ...overrides
});

const normalizeDatabase = (db: MockDatabase): MockDatabase => ({
  accounts: db.accounts,
  employeeByUid: db.employeeByUid,
  companyByUid: Object.fromEntries(
    Object.entries(db.companyByUid).map(([uid, snapshot]) => [
      uid,
      createDefaultCompanySnapshot(snapshot)
    ])
  ),
  farmerByUid: Object.fromEntries(
    Object.entries(db.farmerByUid).map(([uid, snapshot]) => [
      uid,
      createDefaultFarmerSnapshot({
        ...snapshot,
        certifications: snapshot.certifications ?? []
      })
    ])
  )
});

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
        certifications: [...snapshot.certifications],
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
        created,
        true,
        {
          designation: 'Operations analyst',
          location: 'Bengaluru'
        }
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
        created,
        true,
        {
          cin: 'U72900KA2021PTC018BCX',
          industry: 'Technology services',
          companySize: '250-500 employees'
        }
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
        created,
        true,
        {
          farmSize: '24 acres',
          cropType: 'Sugarcane and millet',
          village: 'Mandya, Karnataka'
        }
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
        created,
        true,
        {
          designation: 'Finance lead',
          location: 'Bengaluru'
        }
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
        created,
        true,
        {
          designation: 'HR business partner',
          location: 'Bengaluru'
        }
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
        created,
        true,
        {
          farmSize: '31 acres',
          cropType: 'Ragi and agroforestry',
          village: 'Tumakuru, Karnataka'
        }
      )
    }
  };

  const employeeByUid = {
    emp_1: {
      score: 44,
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
        action('a_4', 'Drove car', 'car', -5, '2026-04-08T09:00:00.000Z'),
        action('a_7', 'Carpooled with a teammate', 'carpool', 12, '2026-04-10T08:40:00.000Z')
      ]
    },
    emp_2: {
      score: 67,
      rank: 1,
      actions: [
        action('a_5', 'Worked from home', 'wfh', 18, '2026-04-10T06:30:00.000Z'),
        action('a_8', 'Cycled to work', 'bike', 15, '2026-04-09T07:30:00.000Z'),
        action('a_9', 'Saved electricity', 'electricity', 12, '2026-04-09T18:15:00.000Z'),
        action('a_10', 'Public transport', 'bus', 10, '2026-04-08T08:00:00.000Z'),
        action('a_11', 'Carpooled with a teammate', 'carpool', 12, '2026-04-07T08:20:00.000Z')
      ]
    },
    emp_3: {
      score: 29,
      rank: 1,
      actions: [
        action('a_6', 'Public transport', 'bus', 10, '2026-04-09T13:20:00.000Z'),
        action('a_12', 'Carpooled with a teammate', 'carpool', 12, '2026-04-10T09:10:00.000Z'),
        action('a_13', 'Saved electricity', 'electricity', 12, '2026-04-08T17:05:00.000Z'),
        action('a_14', 'Drove car', 'car', -5, '2026-04-07T09:00:00.000Z')
      ]
    }
  };

  const companyByUid = {
    co_1: createDefaultCompanySnapshot({
      bcxIndex: 58,
      creditsPurchased: 12,
      employeeCount: 3,
      totalScore: 140,
      electricityKwh: 82_000,
      fuelLitres: 15_800,
      commuteBaselineTonnes: 18.4,
      renewableShare: 0.18,
      netZeroTargetYear: 2030,
      transactions: [
        tx(
          't_1',
          'co_1',
          'farmer_1',
          5,
          2_800,
          '2026-04-10T05:00:00.000Z',
          'GreenTech Inc',
          'Ravi Kumar',
          getCreditPrice(1.12)
        ),
        tx(
          't_2',
          'co_1',
          'farmer_2',
          7,
          3_780,
          '2026-04-09T05:00:00.000Z',
          'GreenTech Inc',
          'Meena Fields',
          getCreditPrice(1.08)
        )
      ]
    })
  };

  const farmerByUid = {
    farmer_1: createDefaultFarmerSnapshot({
      availableCredits: 28,
      soldCredits: 12,
      earnings: 6_720,
      village: 'Mandya, Karnataka',
      methodology: 'Soil carbon + regenerative irrigation',
      certifications: ['Organic', 'Water stewardship'],
      verificationScore: 92,
      priceMultiplier: 1.12,
      saleHistory: [
        tx(
          'ft_1',
          'co_1',
          'farmer_1',
          5,
          2_800,
          '2026-04-10T05:00:00.000Z',
          'GreenTech Inc',
          'Ravi Kumar',
          getCreditPrice(1.12)
        )
      ]
    }),
    farmer_2: createDefaultFarmerSnapshot({
      availableCredits: 40,
      soldCredits: 7,
      earnings: 3_780,
      village: 'Tumakuru, Karnataka',
      methodology: 'Agroforestry + solar pump irrigation',
      certifications: ['Biodiversity', 'Solar irrigation'],
      verificationScore: 88,
      priceMultiplier: 1.08,
      saleHistory: [
        tx(
          'ft_2',
          'co_1',
          'farmer_2',
          7,
          3_780,
          '2026-04-09T05:00:00.000Z',
          'GreenTech Inc',
          'Meena Fields',
          getCreditPrice(1.08)
        )
      ]
    })
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
    return deepCopy(normalizeDatabase(parsed));
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
  credits: number,
  pricePerTonne = CREDIT_PRICE,
  buyerName?: string,
  sellerName?: string
): Transaction => {
  const amount = credits * pricePerTonne;
  return {
    id: createId('tx'),
    buyerId,
    sellerId,
    buyerName,
    sellerName,
    credits,
    amount,
    pricePerTonne,
    timestamp: nowMinus(0)
  };
};
