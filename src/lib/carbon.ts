import type { EcoAction } from '../types';

export const ELECTRICITY_EMISSION_FACTOR = 0.00082;
export const FUEL_EMISSION_FACTOR = 0.00231;

type ActionCategory = 'commute' | 'energy';

interface ActionImpactMeta {
  label: string;
  tonnes: number;
  category: ActionCategory;
}

const actionImpactMap: Record<string, { label: string; factor: number; category: ActionCategory }> = {
  bike: { label: 'Cycling', factor: 0.00018, category: 'commute' }, // tonnes avoided per km (comparing to car)
  bus: { label: 'Public transport', factor: 0.00008, category: 'commute' }, // avoided per km
  carpool: { label: 'Carpooling', factor: 0.00009, category: 'commute' }, // avoided per km
  wfh: { label: 'Work from home', factor: 0.021, category: 'commute' }, // avoided per day
  electricity: { label: 'Energy saving', factor: 0.00082, category: 'energy' }, // avoided per kWh
  car: { label: 'Solo car commute', factor: -0.00018, category: 'commute' } // added per km
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const roundNumber = (value: number, digits = 1): number =>
  Number(value.toFixed(digits));

export const getActionImpactMeta = (action: Pick<EcoAction, 'type' | 'pts' | 'value'>): ActionImpactMeta => {
  const known = actionImpactMap[action.type];
  if (known) {
    const val = action.value || (action.type === 'wfh' ? 1 : 10); // default to 10 units if none provided
    return { ...known, tonnes: known.factor * val };
  }

  if (action.pts < 0) {
    return { label: action.type, tonnes: -0.005, category: 'commute' };
  }

  return { label: action.type, tonnes: 0.006, category: 'energy' };
};

export const getNetActionImpactTonnes = (actions: EcoAction[]): number =>
  actions.reduce((sum, action) => sum + getActionImpactMeta(action).tonnes, 0);

export const getCommuteImpactTonnes = (actions: EcoAction[]): number =>
  actions.reduce((sum, action) => {
    const meta = getActionImpactMeta(action);
    return meta.category === 'commute' ? sum + meta.tonnes : sum;
  }, 0);

export const getPositiveActionRate = (actions: EcoAction[]): number => {
  if (!actions.length) {
    return 0;
  }

  const positiveCount = actions.filter((action) => action.pts >= 0).length;
  return positiveCount / actions.length;
};

export const getDominantActionLabel = (actions: EcoAction[]): string => {
  if (!actions.length) {
    return 'No actions logged';
  }

  const counts = new Map<string, number>();
  actions.forEach((action) => {
    counts.set(action.type, (counts.get(action.type) ?? 0) + 1);
  });

  const [topType] =
    [...counts.entries()].sort((left, right) => right[1] - left[1])[0] ?? [];

  return topType ? getActionImpactMeta({ type: topType, pts: 0 }).label : 'No actions logged';
};

export const getMostRecentActionAt = (actions: EcoAction[]): Date | null =>
  actions.reduce<Date | null>(
    (latest, action) =>
      !latest || action.timestamp.getTime() > latest.getTime() ? action.timestamp : latest,
    null
  );
