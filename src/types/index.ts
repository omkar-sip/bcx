export type Role = 'employee' | 'company' | 'farmer';
export type ScopeId = 'scope1' | 'scope2' | 'scope3';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  company: string | null;
  profileComplete: boolean;
  // Employee-specific
  designation?: string;
  location?: string;
  // Company-specific
  cin?: string;
  industry?: string;
  companySize?: string;
  // Farmer-specific
  farmSize?: string;
  cropType?: string;
  village?: string;
  createdAt: Date;
}

export interface EcoAction {
  id: string;
  action: string;
  type: 'bike' | 'bus' | 'car' | 'electricity' | 'wfh' | 'carpool' | 'diet' | string;
  pts: number;
  value?: number;
  unit?: string;
  timestamp: Date;
}

export interface CarbonCredit {
  id: string;
  farmerId: string;
  farmerName: string;
  tonnes: number;
  pricePerTonne: number;
  available: boolean;
  listedAt: Date;
}

export interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  buyerName?: string;
  sellerName?: string;
  credits: number;
  amount: number;
  pricePerTonne?: number;
  timestamp: Date;
}

export interface MarketplaceCredit {
  farmerId: string;
  farmerName: string;
  tonnesAvailable: number;
  pricePerTonne: number;
  village: string;
  methodology: string;
  certifications: string[];
  verificationScore: number;
  priceMultiplier: number;
  settlementDays: number;
}

export interface BcxIndexBreakdown {
  reduction: number;
  participation: number;
  offsets: number;
}

export interface CompanyScopeMetric {
  id: ScopeId;
  label: string;
  tonnes: number;
  share: number;
  driver: string;
  insight: string;
  status: 'critical' | 'watch' | 'healthy';
}

export interface CompanyAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  action: string;
}

export interface AbatementInitiative {
  id: string;
  title: string;
  scope: ScopeId;
  owner: string;
  reductionTonnes: number;
  investment: number;
  paybackMonths: number;
  priority: 'Now' | 'Next' | 'Monitor';
  detail: string;
}

export interface EmployeeProgramMetrics {
  activeEmployees: number;
  participationRate: number;
  totalActions: number;
  positiveActionRate: number;
  commuteReductionTonnes: number;
  dominantAction: string;
  latestActionAt: Date | null;
}

export interface OffsetCoveragePlan {
  grossTonnes: number;
  netTonnes: number;
  coverageRate: number;
  targetCoverageRate: number;
  creditsNeededForNeutrality: number;
  creditsNeededForTarget: number;
  estimatedBudgetToNeutralize: number;
  marketLiquidityTonnes: number;
  averagePrice: number;
}

export interface EmployeeSnapshot {
  actions: EcoAction[];
  score: number;
  rank: number;
}

export interface CompanySnapshot {
  bcxIndex: number;
  creditsPurchased: number;
  transactions: Transaction[];
  employeeCount: number;
  totalScore: number;
  electricityKwh: number;
  fuelLitres: number;
  commuteBaselineTonnes: number;
  renewableShare: number;
  netZeroTargetYear: number;
}

export interface FarmerSnapshot {
  availableCredits: number;
  soldCredits: number;
  earnings: number;
  saleHistory: Transaction[];
  village: string;
  methodology: string;
  certifications: string[];
  verificationScore: number;
  priceMultiplier: number;
}

export interface AuthRecord {
  profile: UserProfile;
  password: string;
}

export interface MockDatabase {
  accounts: Record<string, AuthRecord>;
  employeeByUid: Record<string, EmployeeSnapshot>;
  companyByUid: Record<string, CompanySnapshot>;
  farmerByUid: Record<string, FarmerSnapshot>;
}
