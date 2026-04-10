export type Role = 'employee' | 'company' | 'farmer';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  company: string | null;
  createdAt: Date;
}

export interface EcoAction {
  id: string;
  action: string;
  type: 'bike' | 'bus' | 'car' | 'electricity' | string;
  pts: number;
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
  credits: number;
  amount: number;
  timestamp: Date;
}

export interface MarketplaceCredit {
  farmerId: string;
  farmerName: string;
  tonnesAvailable: number;
  pricePerTonne: number;
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
}

export interface FarmerSnapshot {
  availableCredits: number;
  soldCredits: number;
  earnings: number;
  saleHistory: Transaction[];
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
