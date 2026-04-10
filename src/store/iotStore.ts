/**
 * iotStore.ts
 * Simulates a high-frequency real-time continuous ping stream from machinery.
 * Runs algorithms for power-to-energy integration and anomaly detection.
 */
import { create } from 'zustand';

export interface TelemetryPoint {
  time: Date;
  kw: number;
}

export interface EquipmentStream {
  id: string;
  name: string;
  type: 'HVAC' | 'ServerRack' | 'CNC';
  status: 'online' | 'offline' | 'anomaly';
  currentKw: number;
  totalKwhAccumulated: number;
  baselineKw: number;
  history: TelemetryPoint[]; // Keep last N points for moving chart
}

interface IoTStoreState {
  isConnected: boolean;
  apiKey: string;
  webhookUrl: string;
  streams: EquipmentStream[];
  totalCumulativeTonnes: number;
  generateCredentials: () => void;
  toggleConnection: () => void;
  simulateTick: () => void;
}

const HISTORY_LENGTH = 30; // 30 seconds of history per machine
const UPDATE_INTERVAL_MS = 1000; // 1 tick per second
const ELECTRICITY_KG_PER_KWH = 0.708;

// Initial mock machines
const defaultStreams: EquipmentStream[] = [
  { id: 'm1', name: 'Main HVAC Chiller', type: 'HVAC', status: 'offline', currentKw: 0, totalKwhAccumulated: 420.5, baselineKw: 150, history: [] },
  { id: 'm2', name: 'Server Rack Row A', type: 'ServerRack', status: 'offline', currentKw: 0, totalKwhAccumulated: 850.2, baselineKw: 45, history: [] },
  { id: 'm3', name: 'CNC Lathe Unit 04', type: 'CNC', status: 'offline', currentKw: 0, totalKwhAccumulated: 120.0, baselineKw: 25, history: [] }
];

export const useIotStore = create<IoTStoreState>((set, get) => {
  let simInterval: ReturnType<typeof setInterval> | null = null;

  return {
    isConnected: false,
    apiKey: '',
    webhookUrl: 'https://api.bcx.in/v1/telemetry/ingest',
    streams: defaultStreams,
    totalCumulativeTonnes: 0,

    generateCredentials: () => {
      set({ apiKey: `bcx_iot_${crypto.randomUUID().split('-')[0]}...` });
    },

    toggleConnection: () => {
      const { isConnected, simulateTick } = get();
      if (isConnected) {
        // Disconnect
        if (simInterval) clearInterval(simInterval);
        set((state) => ({
          isConnected: false,
          streams: state.streams.map(s => ({ ...s, status: 'offline', currentKw: 0, history: [] }))
        }));
      } else {
        // Connect
        set((state) => {
          const now = new Date();
          // Pre-fill history to make chart look alive instantly
          const updatedStreams = state.streams.map(s => {
            const hist: TelemetryPoint[] = [];
            for (let i = HISTORY_LENGTH; i > 0; i--) {
              hist.push({ time: new Date(now.getTime() - i * 1000), kw: s.baselineKw + (Math.random() * 10 - 5) });
            }
            return { ...s, status: 'online' as const, history: hist };
          });
          return { isConnected: true, streams: updatedStreams };
        });
        simInterval = setInterval(simulateTick, UPDATE_INTERVAL_MS);
      }
    },

    simulateTick: () => {
      set((state) => {
        if (!state.isConnected) return state;

        const now = new Date();
        let frameEmissionIncrement = 0;

        const nextStreams = state.streams.map((stream) => {
          // 1. Generate live power data (add some noise)
          let delta = (Math.random() * 10) - 5;
          let newKw = stream.currentKw === 0 ? stream.baselineKw : stream.currentKw + delta;
          
          // Introduce random large anomaly (Z-score trigger)
          const isAnomaly = Math.random() < 0.05;
          if (isAnomaly) {
            newKw = stream.baselineKw * 1.8; // 80% spike
          } else {
            // Revert towards baseline
            if (newKw > stream.baselineKw * 1.2) newKw *= 0.9;
            if (newKw < stream.baselineKw * 0.8) newKw *= 1.1;
          }

          // 2. Integration / Riemann Sum for Energy
          // Energy (kWh) = Power (kW) * (1 sec / 3600 sec/hr)
          const energyThisSecond = newKw * (UPDATE_INTERVAL_MS / 3600000);
          
          // 3. Accumulate Carbon
          frameEmissionIncrement += (energyThisSecond * ELECTRICITY_KG_PER_KWH) / 1000; // tCO2e

          const newPoint = { time: now, kw: newKw };
          const newHistory = [...stream.history, newPoint].slice(-HISTORY_LENGTH);

          return {
            ...stream,
            currentKw: newKw,
            totalKwhAccumulated: stream.totalKwhAccumulated + energyThisSecond,
            status: (isAnomaly ? 'anomaly' : 'online') as 'online' | 'offline' | 'anomaly',
            history: newHistory,
          };
        });

        return {
          streams: nextStreams,
          totalCumulativeTonnes: state.totalCumulativeTonnes + frameEmissionIncrement
        };
      });
    }
  };
});
