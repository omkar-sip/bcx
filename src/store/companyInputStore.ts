import { create } from 'zustand';
import { ELECTRICITY_EMISSION_FACTOR, FUEL_EMISSION_FACTOR, roundNumber } from '../lib/carbon';

// ── Input shapes ──────────────────────────────────────────────────────────────

export interface Scope1Input {
  fuelLitres: string;
  fleetKm: string;
  lpgKg: string;
  generatorLitres: string;
}

export interface Scope2Input {
  electricityKwh: string;
  renewablePercent: string;
  heatingKwh: string;
}

export interface Scope3Input {
  employeeCount: string;
  avgCommuteKm: string;
  workDaysPerYear: string;
  airTravelKm: string;
  supplyChainSpendLakh: string;
}

export interface LocationInput {
  id: string;
  name: string;
  city: string;
  type: 'office' | 'factory' | 'warehouse';
  electricityKwh: string;
  fuelLitres: string;
  isValid?: 'idle' | 'validating' | 'valid' | 'invalid';
}

export interface VehicleInput {
  id: string;
  reg: string;
  type: 'car' | 'truck' | 'bus' | 'two-wheeler';
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric';
  km: string;
}

export interface ImportedVehicleRecord {
  id: string;
  label: string;
  vehicleType: VehicleInput['type'];
  fuelType: VehicleInput['fuelType'];
  annualKm: number;
  estimatedEmissionsTonnes: number;
  sourceRow: Record<string, unknown>;
}

export interface ImportedLocationRecord {
  id: string;
  label: string;
  city: string;
  locationType: LocationInput['type'];
  annualElectricityKwh: number;
  annualFuelLitres: number;
  renewablePercentage: number;
  estimatedEmissionsTonnes: number;
  sourceRow: Record<string, unknown>;
}

export interface ImportedEmployeeRecord {
  id: string;
  name: string;
  department: string;
  commuteMode: string;
  oneWayDistanceKm: number;
  workDaysPerYear: number;
  emissionFactorKgPerKm: number;
  annualEmissionsTonnes: number;
  sourceRow: Record<string, unknown>;
}

export interface ImportedFuelRecord {
  id: string;
  assetName: string;
  fuelType: string;
  quantity: number;
  distanceKm: number;
  emissionFactorKgPerUnit: number;
  annualEmissionsTonnes: number;
  sourceRow: Record<string, unknown>;
}

export interface BulkImportState {
  vehicles: ImportedVehicleRecord[];
  locations: ImportedLocationRecord[];
  employees: ImportedEmployeeRecord[];
  fuel: ImportedFuelRecord[];
}

// ── Computed emissions ────────────────────────────────────────────────────────

export interface ScopeEmissions {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface CompanyInputState {
  reportingYear: number;
  industry: string;
  country: string;
  scope1: Scope1Input;
  scope2: Scope2Input;
  scope3: Scope3Input;
  locations: LocationInput[];
  vehicles: VehicleInput[];
  bulkImports: BulkImportState;

  // Computed
  emissions: ScopeEmissions;

  // Actions
  setReportingYear: (year: number) => void;
  setIndustry: (value: string) => void;
  setCountry: (value: string) => void;
  updateScope1: (partial: Partial<Scope1Input>) => void;
  updateScope2: (partial: Partial<Scope2Input>) => void;
  updateScope3: (partial: Partial<Scope3Input>) => void;
  addLocation: () => void;
  updateLocation: (id: string, partial: Partial<LocationInput>) => void;
  removeLocation: (id: string) => void;
  addVehicle: () => void;
  updateVehicle: (id: string, partial: Partial<VehicleInput>) => void;
  removeVehicle: (id: string) => void;
  recalculate: () => void;
  validateLocationCity: (id: string, city: string) => Promise<void>;
  loadBulkData: (
    type: 'vehicles' | 'locations' | 'employees' | 'fuel',
    data: ImportedVehicleRecord[] | ImportedLocationRecord[] | ImportedEmployeeRecord[] | ImportedFuelRecord[]
  ) => void;
  loadFromCloud: (data: Partial<CompanyInputState>) => void;
}

// ── Emission calculation helpers ──────────────────────────────────────────────

const n = (v: string): number => {
  const parsed = parseFloat(v);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
};

const FUEL_FACTOR = FUEL_EMISSION_FACTOR; // kg CO2e per litre diesel
const ELEC_FACTOR = ELECTRICITY_EMISSION_FACTOR; // kg CO2e per kWh (India grid)
const LPG_FACTOR = 2.96; // kg CO2e per kg LPG
const PETROL_FACTOR = 2.31;
const CNG_FACTOR = 2.21; // per kg ≈ per litre equiv
// Scope 3
const COMMUTE_FACTOR = 0.00012; // tCO2e per person per km per day (avg mixed transport)
const AIR_FACTOR = 0.000115; // tCO2e per km
const SUPPLY_CHAIN_FACTOR = 0.85; // tCO2e per lakh INR spend

function calcEmissions(
  s1: Scope1Input,
  s2: Scope2Input,
  s3: Scope3Input,
  locations: LocationInput[],
  vehicles: VehicleInput[]
): ScopeEmissions {
  // -- Scope 1 --
  const fuelTonnes = n(s1.fuelLitres) * FUEL_FACTOR / 1000;
  const lpgTonnes = n(s1.lpgKg) * LPG_FACTOR / 1000;
  const genTonnes = n(s1.generatorLitres) * FUEL_FACTOR / 1000;

  // vehicle fleet (Scope 1 direct)
  const vehicleScope1 = vehicles.reduce((sum, v) => {
    if (v.fuelType === 'electric') return sum;
    const factor = v.fuelType === 'petrol' ? PETROL_FACTOR : v.fuelType === 'cng' ? CNG_FACTOR : FUEL_FACTOR;
    return sum + (n(v.km) * factor * 0.001) / 1000; // assume 0.001 l/km baseline
  }, 0);

  // location fuel
  const locationScope1 = locations.reduce((sum, loc) => sum + n(loc.fuelLitres) * FUEL_FACTOR / 1000, 0);

  const scope1 = roundNumber(fuelTonnes + lpgTonnes + genTonnes + vehicleScope1 + locationScope1);

  // -- Scope 2 --
  const renewable = Math.min(1, n(s2.renewablePercent) / 100);
  const gridKwh = n(s2.electricityKwh) * (1 - renewable);
  const heatingKwh = n(s2.heatingKwh);
  const locationElec = locations.reduce((sum, loc) => sum + n(loc.electricityKwh) * (1 - renewable), 0);
  const scope2 = roundNumber((gridKwh + heatingKwh * 0.8 + locationElec) * ELEC_FACTOR / 1000);

  // -- Scope 3 --
  const commuteTonnes = n(s3.employeeCount) * n(s3.avgCommuteKm) * 2 * n(s3.workDaysPerYear) * COMMUTE_FACTOR;
  const airTonnes = n(s3.airTravelKm) * AIR_FACTOR;
  const supplyTonnes = n(s3.supplyChainSpendLakh) * SUPPLY_CHAIN_FACTOR;
  const scope3 = roundNumber(commuteTonnes + airTonnes + supplyTonnes);

  return {
    scope1,
    scope2,
    scope3,
    total: roundNumber(scope1 + scope2 + scope3)
  };
}

// ── Store factory ─────────────────────────────────────────────────────────────

const defaultScope1: Scope1Input = { fuelLitres: '', fleetKm: '', lpgKg: '', generatorLitres: '' };
const defaultScope2: Scope2Input = { electricityKwh: '', renewablePercent: '', heatingKwh: '' };
const defaultScope3: Scope3Input = {
  employeeCount: '',
  avgCommuteKm: '',
  workDaysPerYear: '250',
  airTravelKm: '',
  supplyChainSpendLakh: ''
};
const defaultBulkImports: BulkImportState = {
  vehicles: [],
  locations: [],
  employees: [],
  fuel: []
};

export const useCompanyInputStore = create<CompanyInputState>((set, get) => ({
  reportingYear: new Date().getFullYear(),
  industry: '',
  country: 'India',
  scope1: defaultScope1,
  scope2: defaultScope2,
  scope3: defaultScope3,
  locations: [],
  vehicles: [],
  bulkImports: defaultBulkImports,
  emissions: { scope1: 0, scope2: 0, scope3: 0, total: 0 },

  setReportingYear: (year) => { set({ reportingYear: year }); get().recalculate(); },
  setIndustry: (value) => set({ industry: value }),
  setCountry: (value) => set({ country: value }),

  updateScope1: (partial) => {
    set((s) => ({ scope1: { ...s.scope1, ...partial } }));
    get().recalculate();
  },
  updateScope2: (partial) => {
    set((s) => ({ scope2: { ...s.scope2, ...partial } }));
    get().recalculate();
  },
  updateScope3: (partial) => {
    set((s) => ({ scope3: { ...s.scope3, ...partial } }));
    get().recalculate();
  },

  addLocation: () => {
    const id = crypto.randomUUID();
    set((s) => ({
      locations: [...s.locations, { id, name: '', city: '', type: 'office', electricityKwh: '', fuelLitres: '', isValid: 'idle' }]
    }));
  },
  updateLocation: (id, partial) => {
    set((s) => ({ locations: s.locations.map((l) => l.id === id ? { ...l, ...partial } : l) }));
    get().recalculate();
  },
  removeLocation: (id) => {
    set((s) => ({ locations: s.locations.filter((l) => l.id !== id) }));
    get().recalculate();
  },
  
  validateLocationCity: async (id: string, city: string) => {
    const trimmed = city.trim();
    if (!trimmed) {
      set((s) => ({ locations: s.locations.map(l => l.id === id ? { ...l, isValid: 'idle' } : l) }));
      return;
    }

    set((s) => ({ locations: s.locations.map(l => l.id === id ? { ...l, isValid: 'validating' } : l) }));

    try {
      const apiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY;
      const url = apiKey 
        ? `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(trimmed)}&format=json&limit=1`
        : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
        
      // Intentional delay for realistic UI UX
      await new Promise(res => setTimeout(res, 800));

      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) throw new Error('Geocoding error');
      
      const data = await res.json();
      const isValid = Array.isArray(data) && data.length > 0;
      
      set((s) => ({ locations: s.locations.map(l => l.id === id ? { ...l, isValid: isValid ? 'valid' : 'invalid' } : l) }));
    } catch (e) {
      console.error('City validation error', e);
      set((s) => ({ locations: s.locations.map(l => l.id === id ? { ...l, isValid: 'invalid' } : l) }));
    }
  },

  addVehicle: () => {
    const id = crypto.randomUUID();
    set((s) => ({
      vehicles: [...s.vehicles, { id, reg: '', type: 'car', fuelType: 'petrol', km: '' }]
    }));
  },
  updateVehicle: (id, partial) => {
    set((s) => ({ vehicles: s.vehicles.map((v) => v.id === id ? { ...v, ...partial } : v) }));
    get().recalculate();
  },
  removeVehicle: (id) => {
    set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }));
    get().recalculate();
  },

  recalculate: () => {
    const { scope1, scope2, scope3, locations, vehicles } = get();
    const emissions = calcEmissions(scope1, scope2, scope3, locations, vehicles);
    set({ emissions });
  },

  loadBulkData: (type, data) => {
    if (type === 'vehicles') {
      const rows = data as ImportedVehicleRecord[];
      set((s) => ({
        bulkImports: {
          ...s.bulkImports,
          vehicles: [...s.bulkImports.vehicles, ...rows]
        },
        vehicles: [
          ...s.vehicles,
          ...rows.map((row) => ({
            id: row.id,
            reg: row.label,
            type: row.vehicleType,
            fuelType: row.fuelType,
            km: String(row.annualKm)
          }))
        ],
        scope1: {
          ...s.scope1,
          fleetKm: String(n(s.scope1.fleetKm) + rows.reduce((sum, row) => sum + row.annualKm, 0))
        }
      }));
    } else if (type === 'locations') {
      const rows = data as ImportedLocationRecord[];
      const importedElectricity = rows.reduce((sum, row) => sum + row.annualElectricityKwh, 0);
      const weightedRenewable = importedElectricity > 0
        ? rows.reduce((sum, row) => sum + row.annualElectricityKwh * row.renewablePercentage, 0) / importedElectricity
        : 0;
      const existingElectricity = n(get().scope2.electricityKwh);
      const existingRenewable = n(get().scope2.renewablePercent);
      const mergedElectricity = existingElectricity + importedElectricity;
      const mergedRenewable = mergedElectricity > 0
        ? Math.round(((existingElectricity * existingRenewable) + (importedElectricity * weightedRenewable)) / mergedElectricity)
        : 0;

      set((s) => ({
        bulkImports: {
          ...s.bulkImports,
          locations: [...s.bulkImports.locations, ...rows]
        },
        locations: [
          ...s.locations,
          ...rows.map((row) => ({
            id: row.id,
            name: row.label,
            city: row.city,
            type: row.locationType,
            electricityKwh: String(row.annualElectricityKwh),
            fuelLitres: String(row.annualFuelLitres),
            isValid: 'idle' as const
          }))
        ],
        scope2: {
          ...s.scope2,
          electricityKwh: String(mergedElectricity),
          renewablePercent: String(mergedRenewable)
        }
      }));
    } else if (type === 'employees') {
      const rows = data as ImportedEmployeeRecord[];
      const existingCount = n(get().scope3.employeeCount);
      const importedCount = rows.length;
      const totalKm = rows.reduce((sum, row) => sum + row.oneWayDistanceKm, 0);
      const totalDays = rows.reduce((sum, row) => sum + row.workDaysPerYear, 0);
      const mergedCount = existingCount + importedCount;
      const mergedDistance = mergedCount > 0
        ? Math.round(((existingCount * n(get().scope3.avgCommuteKm)) + totalKm) / mergedCount)
        : 0;
      const mergedDays = mergedCount > 0
        ? Math.round(((existingCount * n(get().scope3.workDaysPerYear)) + totalDays) / mergedCount)
        : 250;

      set((s) => ({
        bulkImports: {
          ...s.bulkImports,
          employees: [...s.bulkImports.employees, ...rows]
        },
        scope3: {
          ...s.scope3,
          employeeCount: String(mergedCount),
          avgCommuteKm: String(mergedDistance),
          workDaysPerYear: String(mergedDays)
        }
      }));
    } else if (type === 'fuel') {
      const rows = data as ImportedFuelRecord[];
      const liquidFuel = rows
        .filter((row) => ['diesel', 'petrol'].includes(row.fuelType.toLowerCase()))
        .reduce((sum, row) => sum + row.quantity, 0);
      const lpgFuel = rows
        .filter((row) => row.fuelType.toLowerCase().includes('lpg'))
        .reduce((sum, row) => sum + row.quantity, 0);
      const generatorFuel = rows
        .filter((row) => row.assetName.toLowerCase().includes('generator'))
        .reduce((sum, row) => sum + row.quantity, 0);

      set((s) => ({
        bulkImports: {
          ...s.bulkImports,
          fuel: [...s.bulkImports.fuel, ...rows]
        },
        scope1: {
          ...s.scope1,
          fuelLitres: String(n(s.scope1.fuelLitres) + liquidFuel),
          lpgKg: String(n(s.scope1.lpgKg) + lpgFuel),
          generatorLitres: String(n(s.scope1.generatorLitres) + generatorFuel)
        }
      }));
    }
    get().recalculate();
  },

  loadFromCloud: (cloudData) => {
    set({
      reportingYear: cloudData.reportingYear ?? get().reportingYear,
      industry: cloudData.industry ?? get().industry,
      country: cloudData.country ?? get().country,
      scope1: cloudData.scope1 ?? get().scope1,
      scope2: cloudData.scope2 ?? get().scope2,
      scope3: cloudData.scope3 ?? get().scope3,
      locations: cloudData.locations ?? get().locations,
      vehicles: cloudData.vehicles ?? get().vehicles,
      bulkImports: cloudData.bulkImports ?? get().bulkImports,
    });
    get().recalculate();
  }
}));
