import { useIotStore, type TelemetryPoint } from '../../../store/iotStore';
import { formatTonnes } from '../../../lib/utils';
import { cx } from '../../../lib/utils';

// Simple scalable SVG line chart for live streaming data without extra dependencies
const LiveChart = ({ history, maxKw, isAnomaly }: { history: TelemetryPoint[], maxKw: number, isAnomaly: boolean }) => {
  if (history.length < 2) return <div className="h-24 w-full bg-slate-50 animate-pulse rounded-xl" />;

  const w = 300;
  const h = 80;
  
  // X axis evenly spaced
  const points = history.map((pt, i) => {
    const x = (i / (history.length - 1)) * w;
    // Y axis inverted (0 is at top in SVG)
    const y = h - (Math.min(pt.kw, maxKw) / maxKw) * h;
    return `${x},${y}`;
  }).join(' ');

  const latestKw = history[history.length - 1].kw;

  return (
    <div className="relative h-24 w-full bg-slate-900 rounded-xl overflow-hidden p-2">
      {/* Grid lines */}
      <div className="absolute top-1/2 left-0 w-full border-t border-slate-800/50" />
      <div className="absolute top-1/4 left-0 w-full border-t border-slate-800/50" />
      <div className="absolute top-3/4 left-0 w-full border-t border-slate-800/50" />
      
      {/* The line */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id={isAnomaly ? "gradAlert" : "gradOk"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isAnomaly ? "#fb7185" : "#34d399"} stopOpacity="0.5" />
            <stop offset="100%" stopColor={isAnomaly ? "#fb7185" : "#34d399"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill={`url(#${isAnomaly ? 'gradAlert' : 'gradOk'})`}
          stroke={isAnomaly ? '#f43f5e' : '#10b981'}
          strokeWidth="2"
          points={`0,${h} ${points} ${w},${h}`}
          className="transition-all duration-300"
        />
      </svg>
      {/* Live Value Badge */}
      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur rounded px-2 py-0.5 border border-white/10">
        <span className={cx("text-xs font-mono font-bold", isAnomaly ? "text-rose-400" : "text-emerald-400")}>
          {latestKw.toFixed(1)} kW
        </span>
      </div>
    </div>
  );
};

export const LiveTelemetrySection = () => {
  const { isConnected, streams, totalCumulativeTonnes } = useIotStore();

  return (
    <div className="space-y-8">
      <div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          Real-Time Telemetry
        </span>
        <h2 className="mt-2 text-xl font-extrabold text-brand-ink">Live Equipment Control Center</h2>
        <p className="mt-1 max-w-xl text-sm text-slate-500">
          Monitor your continuous integration data stream globally. The BCX engine mathematically integrates kW power draw over time instantly converting it to your cumulative carbon footprint.
        </p>
      </div>

      {!isConnected && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <div className="text-4xl mb-4">🔌</div>
          <p className="text-slate-600 font-bold text-sm">Simulator stands offline</p>
          <p className="text-slate-400 text-xs mt-1">Go to the IoT Connectors section to start the mock data stream.</p>
        </div>
      )}

      {isConnected && (
        <div className="space-y-6">
          {/* Main Top Widget */}
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-900 to-slate-900"></div>
             <div className="relative z-10 text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">Live Accumulation Engine</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-mono font-extrabold tracking-tight">{formatTonnes(totalCumulativeTonnes, 4)}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 max-w-sm">
                  Continuously calculated Riemann sum of real-time power integrated against prevailing grid emission factors.
                </p>
             </div>
             
             <div className="relative z-10 flex gap-4 mt-6 md:mt-0">
               <div className="bg-white/10 rounded-xl p-4 min-w-[120px] text-center backdrop-blur">
                 <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">Active Streams</p>
                 <p className="text-2xl font-bold">{streams.length}</p>
               </div>
               <div className="bg-white/10 rounded-xl p-4 min-w-[120px] text-center backdrop-blur">
                 <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">Alerts</p>
                 <p className={`text-2xl font-bold ${streams.some(s => s.status === 'anomaly') ? 'text-rose-400' : 'text-emerald-400'}`}>
                   {streams.filter(s => s.status === 'anomaly').length}
                 </p>
               </div>
             </div>
          </div>

          {/* Machine List */}
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pt-4">Equipment Data Streams</h3>
          <div className="grid lg:grid-cols-3 gap-5">
            {streams.map(stream => (
              <div key={stream.id} className={cx(
                "rounded-2xl border bg-white p-5 shadow-sm transition-colors",
                stream.status === 'anomaly' ? "border-rose-300" : "border-slate-200"
              )}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-sm text-brand-ink">{stream.name}</h4>
                    <p className="text-xs text-slate-400">{stream.type}</p>
                  </div>
                  <span className={cx(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    stream.status === 'anomaly' ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700 animate-pulse"
                  )}>
                    {stream.status === 'anomaly' ? 'Spike Detected' : 'Receiving'}
                  </span>
                </div>

                <LiveChart 
                  history={stream.history} 
                  maxKw={stream.baselineKw * 2.5} 
                  isAnomaly={stream.status === 'anomaly'}
                />

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Baseline Rate</p>
                    <p className="text-sm font-semibold">{stream.baselineKw} kW</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Session Accumulation</p>
                    <p className="text-sm font-semibold text-emerald-600">{(stream.totalKwhAccumulated).toFixed(2)} kWh</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
