import { create } from 'zustand';
import {
  addMockTransaction,
  createDefaultCompanySnapshot,
  createDefaultFarmerSnapshot,
  getCreditPrice,
  readDatabase,
  writeDatabase
} from '../data/mockDb';
import {
  clamp,
  ELECTRICITY_EMISSION_FACTOR,
  FUEL_EMISSION_FACTOR,
  getCommuteImpactTonnes,
  getDominantActionLabel,
  getMostRecentActionAt,
  getPositiveActionRate,
  roundNumber
} from '../lib/carbon';
import type {
  AbatementInitiative,
  BcxIndexBreakdown,
  CompanyAlert,
  CompanyScopeMetric,
  EmployeeProgramMetrics,
  MarketplaceCredit,
  OffsetCoveragePlan,
  Transaction
} from '../types';

export interface CompanyEmployeeRow {
  uid: string;
  name: string;
  score: number;
  recentImpactTonnes: number;
  lastActionAt: Date | null;
}

interface CompanyMetrics {
  employees: CompanyEmployeeRow[];
  totalScore: number;
  employeeCount: number;
  bcxIndex: number;
  creditsPurchased: number;
  transactions: Transaction[];
  baselineEmissions: number;
  grossEmissions: number;
  netEmissions: number;
  renewableShare: number;
  netZeroTargetYear: number;
  scopeMetrics: CompanyScopeMetric[];
  dominantScope: CompanyScopeMetric | null;
  alerts: CompanyAlert[];
  initiatives: AbatementInitiative[];
  employeeProgram: EmployeeProgramMetrics;
  offsetPlan: OffsetCoveragePlan;
  indexBreakdown: BcxIndexBreakdown;
}

interface CompanyStoreState extends CompanyMetrics {
  marketplace: MarketplaceCredit[];
  loading: boolean;
  fetchCompanyData: (companyUid: string, companyName: string | null) => Promise<void>;
  buyCredits: (
    companyUid: string,
    companyName: string | null,
    farmerId: string,
    credits: number
  ) => Promise<{ ok: boolean; message: string }>;
}

const DEFAULT_METRICS: CompanyMetrics = {
  employees: [],
  totalScore: 0,
  employeeCount: 0,
  bcxIndex: 0,
  creditsPurchased: 0,
  transactions: [],
  baselineEmissions: 0,
  grossEmissions: 0,
  netEmissions: 0,
  renewableShare: 0,
  netZeroTargetYear: 2030,
  scopeMetrics: [],
  dominantScope: null,
  alerts: [],
  initiatives: [],
  employeeProgram: {
    activeEmployees: 0,
    participationRate: 0,
    totalActions: 0,
    positiveActionRate: 0,
    commuteReductionTonnes: 0,
    dominantAction: 'No actions logged',
    latestActionAt: null
  },
  offsetPlan: {
    grossTonnes: 0,
    netTonnes: 0,
    coverageRate: 0,
    targetCoverageRate: 0.4,
    creditsNeededForNeutrality: 0,
    creditsNeededForTarget: 0,
    estimatedBudgetToNeutralize: 0,
    marketLiquidityTonnes: 0,
    averagePrice: getCreditPrice()
  },
  indexBreakdown: {
    reduction: 0,
    participation: 0,
    offsets: 0
  }
};

const buildMarketplace = (): MarketplaceCredit[] => {
  const db = readDatabase();
  const farmerProfiles = Object.values(db.accounts).filter(
    (item) => item.profile.role === 'farmer'
  );

  return farmerProfiles
    .map((item) => {
      const farmerState = createDefaultFarmerSnapshot(db.farmerByUid[item.profile.uid] ?? {});
      return {
        farmerId: item.profile.uid,
        farmerName: item.profile.name,
        tonnesAvailable: farmerState.availableCredits,
        pricePerTonne: getCreditPrice(farmerState.priceMultiplier),
        village: farmerState.village || item.profile.village || 'Unlisted village',
        methodology: farmerState.methodology,
        certifications: farmerState.certifications,
        verificationScore: farmerState.verificationScore,
        priceMultiplier: farmerState.priceMultiplier,
        settlementDays: Math.max(2, 9 - Math.floor(farmerState.verificationScore / 18))
      };
    })
    .filter((item) => item.tonnesAvailable > 0)
    .sort((left, right) => {
      if (right.verificationScore !== left.verificationScore) {
        return right.verificationScore - left.verificationScore;
      }
      return left.pricePerTonne - right.pricePerTonne;
    });
};

const getStatus = (share: number): CompanyScopeMetric['status'] => {
  if (share >= 0.42) return 'critical';
  if (share >= 0.24) return 'watch';
  return 'healthy';
};

const buildAlerts = ({
  dominantScope,
  coverageRate,
  marketLiquidityTonnes,
  creditsNeededForNeutrality,
  participationRate,
  renewableShare
}: {
  dominantScope: CompanyScopeMetric | null;
  coverageRate: number;
  marketLiquidityTonnes: number;
  creditsNeededForNeutrality: number;
  participationRate: number;
  renewableShare: number;
}): CompanyAlert[] => {
  const alerts: CompanyAlert[] = [];

  if (dominantScope) {
    alerts.push({
      id: 'dominant-scope',
      severity: dominantScope.share >= 0.4 ? 'high' : 'medium',
      title: `${dominantScope.label} is driving most of the inventory`,
      detail: dominantScope.driver,
      action: dominantScope.insight
    });
  }

  alerts.push({
    id: 'offset-coverage',
    severity: coverageRate < 0.15 ? 'high' : coverageRate < 0.3 ? 'medium' : 'low',
    title: coverageRate < 0.15 ? 'Offset coverage is too thin for board reporting' : 'Offsets are helping, but not yet strategic',
    detail:
      coverageRate < 0.15
        ? 'Current credits cover less than 15% of gross emissions.'
        : 'Move toward a standing coverage policy instead of ad hoc purchases.',
    action: 'Use the procurement desk to secure enough credits for the next coverage threshold.'
  });

  alerts.push({
    id: 'employee-program',
    severity: participationRate < 0.6 ? 'medium' : 'low',
    title:
      participationRate < 0.6
        ? 'Employee commute data is too thin to trust Scope 3 signals'
        : 'Employee participation is healthy enough to guide Scope 3 decisions',
    detail: `${Math.round(participationRate * 100)}% of employees logged activity this week.`,
    action:
      participationRate < 0.6
        ? 'Launch weekly nudges, a commute policy, and manager-level adoption targets.'
        : 'Keep monthly prompts active and expand beyond commute into workplace energy habits.'
  });

  alerts.push({
    id: 'market-liquidity',
    severity: marketLiquidityTonnes < creditsNeededForNeutrality ? 'medium' : 'low',
    title:
      marketLiquidityTonnes < creditsNeededForNeutrality
        ? 'Marketplace liquidity cannot neutralize the full gap yet'
        : 'Regional farmer supply is sufficient to close the current gap',
    detail: `${roundNumber(marketLiquidityTonnes, 0)} tCO2e available across live farmer listings.`,
    action:
      marketLiquidityTonnes < creditsNeededForNeutrality
        ? 'Blend procurement with internal abatement so neutrality does not depend on one market window.'
        : 'Use supplier scoring to lock higher-quality credits before prices move.'
  });

  if (renewableShare < 0.2) {
    alerts.push({
      id: 'renewable-share',
      severity: 'medium',
      title: 'Renewable electricity coverage is still subscale',
      detail: `${Math.round(renewableShare * 100)}% of electricity is supported by renewable coverage.`,
      action: 'Treat clean power as the cheapest immediate Scope 2 lever.'
    });
  }

  return alerts.slice(0, 4);
};

const buildInitiatives = (
  scopeMetrics: CompanyScopeMetric[],
  commuteBaselineTonnes: number,
  renewableShare: number
): AbatementInitiative[] => {
  const scope1 = scopeMetrics.find((item) => item.id === 'scope1')?.tonnes ?? 0;
  const scope2 = scopeMetrics.find((item) => item.id === 'scope2')?.tonnes ?? 0;
  const scope3 = scopeMetrics.find((item) => item.id === 'scope3')?.tonnes ?? 0;
  const dominantScope = scopeMetrics[0]?.id;

  const initiatives: AbatementInitiative[] = [
    {
      id: 'renewable-procurement',
      title: 'Expand renewable power coverage for the next reporting cycle',
      scope: 'scope2',
      owner: 'Facilities + finance',
      reductionTonnes: roundNumber(Math.max(6, scope2 * 0.28)),
      investment: Math.round(Math.max(6, scope2 * 0.28) * 52_000),
      paybackMonths: 18,
      priority: dominantScope === 'scope2' || renewableShare < 0.2 ? 'Now' : 'Next',
      detail: `Lift renewable share from ${Math.round(renewableShare * 100)}% to reduce grid-heavy emissions fast.`
    },
    {
      id: 'hvac-controls',
      title: 'Metering, HVAC controls, and shutdown discipline',
      scope: 'scope2',
      owner: 'Facilities',
      reductionTonnes: roundNumber(Math.max(3, scope2 * 0.12)),
      investment: Math.round(Math.max(3, scope2 * 0.12) * 26_000),
      paybackMonths: 8,
      priority: dominantScope === 'scope2' ? 'Now' : 'Next',
      detail: 'A relatively low-capex move that tightens energy discipline and gives better auditability.'
    },
    {
      id: 'fleet-transition',
      title: 'Electrify the highest-utilization fleet and generator loads',
      scope: 'scope1',
      owner: 'Operations',
      reductionTonnes: roundNumber(Math.max(4, scope1 * 0.32)),
      investment: Math.round(Math.max(4, scope1 * 0.32) * 44_000),
      paybackMonths: 24,
      priority: dominantScope === 'scope1' ? 'Now' : 'Monitor',
      detail: 'Focus on the highest fuel-consuming routes first so savings hit quickly.'
    },
    {
      id: 'commute-program',
      title: 'Formalize hybrid work, transit support, and commute incentives',
      scope: 'scope3',
      owner: 'People + admin',
      reductionTonnes: roundNumber(Math.max(2, commuteBaselineTonnes * 0.22)),
      investment: Math.round(Math.max(2, commuteBaselineTonnes * 0.22) * 18_000),
      paybackMonths: 6,
      priority: dominantScope === 'scope3' ? 'Now' : 'Next',
      detail: 'This is the fastest lever for cleaner Scope 3 data and better employee participation.'
    }
  ];

  const priorityOrder: Record<AbatementInitiative['priority'], number> = {
    Now: 0,
    Next: 1,
    Monitor: 2
  };

  return initiatives.sort((left, right) => {
    if (priorityOrder[left.priority] !== priorityOrder[right.priority]) {
      return priorityOrder[left.priority] - priorityOrder[right.priority];
    }
    return right.reductionTonnes - left.reductionTonnes;
  });
};

const calculateCompanyMetrics = (
  companyUid: string,
  companyName: string | null,
  marketplace: MarketplaceCredit[]
): CompanyMetrics => {
  const db = readDatabase();
  const companyState = createDefaultCompanySnapshot(db.companyByUid[companyUid] ?? {});
  const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1_000;

  const employees = Object.values(db.accounts)
    .filter(
      (item) =>
        item.profile.role === 'employee' &&
        companyName &&
        item.profile.company === companyName
    )
    .map((item) => {
      const snapshot = db.employeeByUid[item.profile.uid] ?? { actions: [], score: 0, rank: 1 };
      return {
        uid: item.profile.uid,
        name: item.profile.name,
        score: snapshot.score,
        recentImpactTonnes: roundNumber(getCommuteImpactTonnes(snapshot.actions), 3),
        lastActionAt: getMostRecentActionAt(snapshot.actions)
      };
    })
    .sort((left, right) => right.score - left.score);

  const employeeSnapshots = employees.map((employee) => db.employeeByUid[employee.uid] ?? {
    actions: [],
    score: employee.score,
    rank: 1
  });
  const allActions = employeeSnapshots.flatMap((snapshot) => snapshot.actions);
  const totalScore = employees.reduce((sum, row) => sum + row.score, 0);
  const employeeCount = employees.length;
  const activeEmployees = employees.filter(
    (row) => row.lastActionAt && row.lastActionAt.getTime() >= recentThreshold
  ).length;
  const participationRate = employeeCount ? activeEmployees / employeeCount : 0;
  const totalActions = allActions.length;
  const positiveActionRate = getPositiveActionRate(allActions);
  const commuteImpactTonnes = getCommuteImpactTonnes(allActions);
  const scope1Tonnes = companyState.fuelLitres * FUEL_EMISSION_FACTOR;
  const scope2PotentialTonnes = companyState.electricityKwh * ELECTRICITY_EMISSION_FACTOR;
  const renewableAbatementTonnes = scope2PotentialTonnes * companyState.renewableShare;
  const scope2Tonnes = Math.max(0, scope2PotentialTonnes - renewableAbatementTonnes);
  const scope3Tonnes = Math.max(0, companyState.commuteBaselineTonnes - commuteImpactTonnes);
  const baselineEmissions = scope1Tonnes + scope2PotentialTonnes + companyState.commuteBaselineTonnes;
  const grossEmissions = scope1Tonnes + scope2Tonnes + scope3Tonnes;
  const netEmissions = Math.max(0, grossEmissions - companyState.creditsPurchased);
  const coverageRate = grossEmissions ? companyState.creditsPurchased / grossEmissions : 0;
  const targetCoverageRate = 0.4;
  const marketLiquidityTonnes = marketplace.reduce((sum, item) => sum + item.tonnesAvailable, 0);
  const averagePrice =
    marketplace.length > 0
      ? marketplace.reduce((sum, item) => sum + item.pricePerTonne, 0) / marketplace.length
      : getCreditPrice();
  const creditsNeededForNeutrality = Math.max(0, Math.ceil(netEmissions));
  const creditsNeededForTarget = Math.max(
    0,
    Math.ceil(grossEmissions * targetCoverageRate - companyState.creditsPurchased)
  );
  const operationalReduction = Math.max(0, baselineEmissions - grossEmissions);
  const reductionScore = clamp((operationalReduction / Math.max(baselineEmissions, 1)) / 0.3, 0, 1) * 45;
  const participationScore = clamp(participationRate / 0.75, 0, 1) * 35;
  const offsetsScore = clamp(coverageRate / 0.5, 0, 1) * 20;
  const bcxIndex = Math.round(reductionScore + participationScore + offsetsScore);

  const unsortedScopeMetrics: CompanyScopeMetric[] = [
    {
      id: 'scope1',
      label: 'Scope 1',
      tonnes: roundNumber(scope1Tonnes),
      share: grossEmissions ? scope1Tonnes / grossEmissions : 0,
      driver: `${companyState.fuelLitres.toLocaleString('en-IN')} litres across fleet and backup fuel use`,
      insight: 'Tighten fleet governance and prioritize electrification on the highest-utilization routes.',
      status: getStatus(grossEmissions ? scope1Tonnes / grossEmissions : 0)
    },
    {
      id: 'scope2',
      label: 'Scope 2',
      tonnes: roundNumber(scope2Tonnes),
      share: grossEmissions ? scope2Tonnes / grossEmissions : 0,
      driver: `${companyState.electricityKwh.toLocaleString('en-IN')} kWh with ${Math.round(
        companyState.renewableShare * 100
      )}% renewable coverage`,
      insight: 'Treat clean power and controls as the fastest capital-efficient reduction lever.',
      status: getStatus(grossEmissions ? scope2Tonnes / grossEmissions : 0)
    },
    {
      id: 'scope3',
      label: 'Scope 3',
      tonnes: roundNumber(scope3Tonnes),
      share: grossEmissions ? scope3Tonnes / grossEmissions : 0,
      driver: `${employeeCount} employees with ${activeEmployees} active this week driving commute emissions`,
      insight: 'Use hybrid policies, transit nudges, and manager accountability to improve commute data quality.',
      status: getStatus(grossEmissions ? scope3Tonnes / grossEmissions : 0)
    }
  ];

  const scopeMetrics = [...unsortedScopeMetrics].sort((left, right) => right.tonnes - left.tonnes);
  const dominantScope = scopeMetrics[0] ?? null;
  const initiatives = buildInitiatives(
    scopeMetrics,
    companyState.commuteBaselineTonnes,
    companyState.renewableShare
  );
  const alerts = buildAlerts({
    dominantScope,
    coverageRate,
    marketLiquidityTonnes,
    creditsNeededForNeutrality,
    participationRate,
    renewableShare: companyState.renewableShare
  });

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
    transactions: [...companyState.transactions].sort(
      (left, right) => right.timestamp.getTime() - left.timestamp.getTime()
    ),
    baselineEmissions: roundNumber(baselineEmissions),
    grossEmissions: roundNumber(grossEmissions),
    netEmissions: roundNumber(netEmissions),
    renewableShare: companyState.renewableShare,
    netZeroTargetYear: companyState.netZeroTargetYear,
    scopeMetrics,
    dominantScope,
    alerts,
    initiatives,
    employeeProgram: {
      activeEmployees,
      participationRate,
      totalActions,
      positiveActionRate,
      commuteReductionTonnes: roundNumber(Math.max(0, commuteImpactTonnes), 2),
      dominantAction: getDominantActionLabel(allActions),
      latestActionAt: getMostRecentActionAt(allActions)
    },
    offsetPlan: {
      grossTonnes: roundNumber(grossEmissions),
      netTonnes: roundNumber(netEmissions),
      coverageRate,
      targetCoverageRate,
      creditsNeededForNeutrality,
      creditsNeededForTarget,
      estimatedBudgetToNeutralize: Math.round(creditsNeededForNeutrality * averagePrice),
      marketLiquidityTonnes: roundNumber(marketLiquidityTonnes, 0),
      averagePrice: Math.round(averagePrice)
    },
    indexBreakdown: {
      reduction: Math.round(reductionScore),
      participation: Math.round(participationScore),
      offsets: Math.round(offsetsScore)
    }
  };
};

export const useCompanyStore = create<CompanyStoreState>((set) => ({
  ...DEFAULT_METRICS,
  marketplace: [],
  loading: false,
  fetchCompanyData: async (companyUid, companyName) => {
    set({ loading: true });
    const marketplace = buildMarketplace();
    const metrics = calculateCompanyMetrics(companyUid, companyName, marketplace);
    set({
      ...metrics,
      marketplace,
      loading: false
    });
  },
  buyCredits: async (companyUid, companyName, farmerId, credits) => {
    const db = readDatabase();
    const farmerState = createDefaultFarmerSnapshot(db.farmerByUid[farmerId] ?? {});
    if (!db.farmerByUid[farmerId]) {
      return { ok: false, message: 'Farmer not found.' };
    }
    if (credits <= 0) {
      return { ok: false, message: 'Credits should be greater than zero.' };
    }
    if (farmerState.availableCredits < credits) {
      return { ok: false, message: 'Requested credits exceed availability.' };
    }

    const sellerName =
      Object.values(db.accounts).find((item) => item.profile.uid === farmerId)?.profile.name ??
      'Farmer';
    const pricePerTonne = getCreditPrice(farmerState.priceMultiplier);
    const transaction = addMockTransaction(
      companyUid,
      farmerId,
      credits,
      pricePerTonne,
      companyName ?? 'Company',
      sellerName
    );
    const companyState = createDefaultCompanySnapshot(db.companyByUid[companyUid] ?? {});

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
      message: `Purchased ${credits}t carbon credits from ${sellerName} for INR ${transaction.amount.toLocaleString(
        'en-IN'
      )}.`
    };
  }
}));
