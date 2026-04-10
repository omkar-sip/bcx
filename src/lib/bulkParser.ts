import * as XLSX from 'xlsx';
import type {
  ImportedEmployeeRecord,
  ImportedFuelRecord,
  ImportedLocationRecord,
  ImportedVehicleRecord
} from '../store/companyInputStore';

export interface ParsedBulkData {
  type: 'vehicles' | 'locations' | 'employees' | 'fuel';
  data: Record<string, unknown>[];
}

const normalizeHeader = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');

const normalizeRow = (row: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  );

const inferTypeFromHeaders = (rows: Record<string, unknown>[]): ParsedBulkData['type'] => {
  const firstRow = rows[0] ?? {};
  const headers = Object.keys(firstRow);
  const headerSet = new Set(headers);

  const hasAny = (...patterns: string[]) =>
    patterns.some((pattern) =>
      [...headerSet].some((header) => header.includes(pattern))
    );

  if (hasAny('vehicle', 'registration', 'fuel type', 'annual km')) return 'vehicles';
  if (hasAny('annual electricity', 'renewable percentage', 'scope2 emissions', 'site')) return 'locations';
  if (hasAny('commute mode', 'one way distance', 'work days', 'annual emissions')) return 'employees';
  if (hasAny('fuel consumed', 'emission factor', 'asset name', 'fuel type')) return 'fuel';
  return 'vehicles';
};

const inferTypeFromFileName = (fileName: string): ParsedBulkData['type'] | null => {
  if (fileName.includes('vehicle')) return 'vehicles';
  if (fileName.includes('elec') || fileName.includes('location')) return 'locations';
  if (fileName.includes('commute') || fileName.includes('employee')) return 'employees';
  if (fileName.includes('fuel')) return 'fuel';
  return null;
};

const pickFirst = (row: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = row[normalizeHeader(key)];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const pickNumber = (row: Record<string, unknown>, keys: string[]): number => {
  const value = pickFirst(row, keys);
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const normalizeVehicleType = (value: string): ImportedVehicleRecord['vehicleType'] => {
  const normalized = value.toLowerCase();
  if (normalized.includes('truck') || normalized.includes('lorry')) return 'truck';
  if (normalized.includes('bus')) return 'bus';
  if (normalized.includes('bike') || normalized.includes('scooter') || normalized.includes('two')) {
    return 'two-wheeler';
  }
  return 'car';
};

const normalizeFuelType = (value: string): ImportedVehicleRecord['fuelType'] => {
  const normalized = value.toLowerCase();
  if (normalized.includes('diesel')) return 'diesel';
  if (normalized.includes('cng') || normalized.includes('gas')) return 'cng';
  if (normalized.includes('electric') || normalized.includes('ev')) return 'electric';
  return 'petrol';
};

const normalizeLocationType = (value: string): ImportedLocationRecord['locationType'] => {
  const normalized = value.toLowerCase();
  if (normalized.includes('factory') || normalized.includes('plant')) return 'factory';
  if (normalized.includes('warehouse') || normalized.includes('storage')) return 'warehouse';
  return 'office';
};

const normalizeFuelLabel = (value: string) => {
  const normalized = value.trim();
  return normalized || 'Diesel';
};

export const parseBulkExcel = async (
  file: File,
  preferredType?: ParsedBulkData['type']
): Promise<ParsedBulkData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: ''
        });
        const normalizedRows = rawRows.map(normalizeRow);
        const fileName = file.name.toLowerCase();
        const type =
          preferredType ??
          inferTypeFromFileName(fileName) ??
          inferTypeFromHeaders(normalizedRows);

        resolve({ type, data: normalizedRows });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

export const mapExcelToStore = (
  type: ParsedBulkData['type'],
  rawData: Record<string, unknown>[]
): ImportedVehicleRecord[] | ImportedLocationRecord[] | ImportedEmployeeRecord[] | ImportedFuelRecord[] => {
  switch (type) {
    case 'vehicles':
      return rawData.map((row) => {
        const annualKm = pickNumber(row, ['annual km', 'yearly distance', 'annual distance', 'distance', 'km']);
        const fuelType = normalizeFuelType(pickFirst(row, ['fuel type', 'fuel', 'energy source']) || 'petrol');
        const emissionFactor =
          fuelType === 'diesel' ? 2.68 : fuelType === 'cng' ? 2.21 : fuelType === 'electric' ? 0 : 2.31;
        const estimatedEmissionsTonnes =
          pickNumber(row, ['emissions tco2e', 'annual emissions tco2e']) ||
          (annualKm * emissionFactor * 0.001) / 1000;

        return {
          id: crypto.randomUUID(),
          label: pickFirst(row, ['name', 'vehicle name', 'vehicle id', 'registration', 'reg no']) || 'Unnamed Vehicle',
          vehicleType: normalizeVehicleType(pickFirst(row, ['vehicle type', 'type', 'category']) || 'car'),
          fuelType,
          annualKm,
          estimatedEmissionsTonnes,
          sourceRow: row
        };
      });

    case 'locations':
      return rawData.map((row) => {
        const annualElectricityKwh = pickNumber(row, [
          'annual electricity kwh',
          'electricity kwh',
          'annual kwh',
          'kwh',
          'consumption'
        ]);
        const renewablePercentage = pickNumber(row, ['renewable percentage', 'renewable percent']);
        const annualFuelLitres = pickNumber(row, ['fuel litres', 'fuel', 'diesel litres']);
        const estimatedEmissionsTonnes =
          pickNumber(row, ['scope2 emissions tco2e', 'annual emissions tco2e']) ||
          ((annualElectricityKwh * (1 - Math.min(renewablePercentage, 100) / 100)) * 0.708) / 1000;

        return {
          id: crypto.randomUUID(),
          label: pickFirst(row, ['location', 'site name', 'name', 'department']) || 'Imported Site',
          city: pickFirst(row, ['city', 'address', 'location city']) || 'Imported City',
          locationType: normalizeLocationType(pickFirst(row, ['location type', 'site type', 'type']) || 'office'),
          annualElectricityKwh,
          annualFuelLitres,
          renewablePercentage,
          estimatedEmissionsTonnes,
          sourceRow: row
        };
      });

    case 'employees':
      return rawData.map((row) => {
        const oneWayDistanceKm = pickNumber(row, [
          'one way distance km',
          'daily km',
          'distance',
          'commute km'
        ]);
        const workDaysPerYear = pickNumber(row, ['work days per year', 'days']) || 250;
        const emissionFactorKgPerKm =
          pickNumber(row, ['emission factor kgco2 per km']) || 0.12;
        const annualEmissionsTonnes =
          pickNumber(row, ['annual emissions tco2e']) ||
          (oneWayDistanceKm * 2 * workDaysPerYear * emissionFactorKgPerKm) / 1000;

        return {
          id: crypto.randomUUID(),
          name: pickFirst(row, ['employee name', 'name']) || 'Employee',
          department: pickFirst(row, ['department']) || 'General',
          commuteMode: pickFirst(row, ['commute mode', 'mode', 'transport']) || 'Car',
          oneWayDistanceKm,
          workDaysPerYear,
          emissionFactorKgPerKm,
          annualEmissionsTonnes,
          sourceRow: row
        };
      });

    case 'fuel':
      return rawData.map((row) => {
        const quantity = pickNumber(row, [
          'fuel consumed litres or kg',
          'quantity',
          'amount',
          'total'
        ]);
        const emissionFactorKgPerUnit =
          pickNumber(row, ['emission factor kgco2 per unit']) || 2.68;
        const annualEmissionsTonnes =
          pickNumber(row, ['emissions tco2e', 'annual emissions tco2e']) ||
          (quantity * emissionFactorKgPerUnit) / 1000;

        return {
          id: crypto.randomUUID(),
          assetName: pickFirst(row, ['asset name', 'name']) || 'Imported Asset',
          fuelType: normalizeFuelLabel(pickFirst(row, ['fuel type', 'type']) || 'Diesel'),
          quantity,
          distanceKm: pickNumber(row, ['distance km if applicable', 'distance km', 'distance']),
          emissionFactorKgPerUnit,
          annualEmissionsTonnes,
          sourceRow: row
        };
      });

    default:
      return [];
  }
};
