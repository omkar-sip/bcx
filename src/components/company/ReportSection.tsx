import { useCompanyInputStore } from '../../store/companyInputStore';
import { cx } from '../../lib/utils';
import { useMemo } from 'react';

export const ReportSection = ({ profileName }: { profileName: string }) => {
  const { emissions, reportingYear, locations, vehicles } = useCompanyInputStore();

  const handlePrint = () => {
    window.print();
  };

  const total = emissions.total;
  const p1 = total > 0 ? emissions.scope1 / total : 0;
  const p2 = total > 0 ? emissions.scope2 / total : 0;
  const p3 = total > 0 ? emissions.scope3 / total : 0;

  // Donut chart constants
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - (p1 > 0 ? p1 : 1)); 

  const highestScope = Math.max(emissions.scope1, emissions.scope2, emissions.scope3);
  let primaryConcern = '';
  let suggestiveMeasures: string[] = [];

  if (total === 0) {
    primaryConcern = 'No Data Present';
    suggestiveMeasures = ['Begin by entering your data in the Activity Tracking modules.'];
  } else if (highestScope === emissions.scope1) {
    primaryConcern = 'Scope 1 (Direct Emissions)';
    suggestiveMeasures = [
      'Transition fleet to Electric Vehicles (EVs).',
      'Optimize delivery routing to reduce total fuel consumed.',
      'Replace aging generators with battery backup solutions.'
    ];
  } else if (highestScope === emissions.scope2) {
    primaryConcern = 'Scope 2 (Indirect - Electricity)';
    suggestiveMeasures = [
      'Procure renewable energy certificates (RECs).',
      'Install on-site solar panels for high-consumption locations.',
      'Implement smart building HVAC optimization.'
    ];
  } else {
    primaryConcern = 'Scope 3 (Value Chain)';
    suggestiveMeasures = [
      'Implement work-from-home policies to reduce commute emissions.',
      'Transition corporate flights to sustainable aviation fuel programs.',
      'Engage large suppliers with strict GHG reduction targets.'
    ];
  }

  // Generate combined top sources
  const topSources = useMemo(() => {
    const list = [];
    locations.forEach(l => {
      // rough heuristic if we don't have exact emissions per location
      const val = l.electricityKwh ? l.electricityKwh * 0.8 : 0; // rough tco2e factor
      list.push({ id: l.id, name: l.name || 'Location', type: 'Facility', val, status: 'high' });
    });
    vehicles.forEach(v => {
      const val = v.km ? v.km * 0.2 : 0; // rough factor
      list.push({ id: v.id, name: v.reg || 'Vehicle', type: 'Fleet', val, status: 'medium' });
    });
    return list.sort((a, b) => b.val - a.val).slice(0, 4);
  }, [locations, vehicles]);

  return (
    <div className="mx-auto max-w-7xl">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-container, #report-container * { visibility: visible; }
          #report-container {
            position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0;
            background: white !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Header Bar */}
      <div className="flex justify-between items-center mb-6 px-2 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Carbon Dashboard Report</h2>
          <p className="text-sm text-slate-500">{profileName} • Reporting Year: {reportingYear}</p>
        </div>
        <button
          onClick={handlePrint}
          className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-orange-700 transition-colors"
        >
          Download PDF
        </button>
      </div>

      <div id="report-container" className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#f4f6f8] p-6 rounded-3xl min-h-screen">
        
        {/* COLUMN 1: Left */}
        <div className="space-y-6 flex flex-col">
          
          {/* Card 1: Health Score / Footprint Score */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Footprint</h3>
                 <p className="text-xs text-slate-400 mt-1">Executive Summary</p>
              </div>
              <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-lg border border-yellow-100">Live</span>
            </div>

            <div className="flex items-center justify-between mb-8">
              {/* Donut */}
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle cx="50" cy="50" r={r} fill="none" stroke="#eab308" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-800 leading-none">{total.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-1">tCO₂e</span>
                </div>
              </div>
              
              {/* Mini bars */}
              <div className="flex-1 ml-6 space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 w-16">Scope 1</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: `${Math.max(4, p1 * 100)}%` }}></div>
                  </div>
                  <span className="font-bold text-slate-700 w-10 text-right">{emissions.scope1.toLocaleString()}t</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 w-16">Scope 2</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${Math.max(4, p2 * 100)}%` }}></div>
                  </div>
                  <span className="font-bold text-slate-700 w-10 text-right">{emissions.scope2.toLocaleString()}t</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 w-16">Scope 3</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.max(4, p3 * 100)}%` }}></div>
                  </div>
                  <span className="font-bold text-slate-700 w-10 text-right">{emissions.scope3.toLocaleString()}t</span>
                </div>
              </div>
            </div>
            
             <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
               <div>
                 <p className="text-xs text-slate-500 font-medium">Trajectory Alignment</p>
                 <p className="text-[10px] text-slate-400">Net-Zero Pledge</p>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 w-[25%]"></div>
                 </div>
                 <span className="font-bold text-blue-700 text-sm">25%</span>
               </div>
            </div>
          </div>

          {/* Card 2: Appendices and Docs */}
          <div className="bg-[#f8f9fc] rounded-2xl p-6 border border-slate-100 flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-slate-500" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Attached Evidences
            </h3>
            <div className="space-y-3">
              
              <div className="bg-white rounded-xl p-4 shadow-[0_2px_8px_rgb(0,0,0,0.02)] flex items-center gap-4">
                <div className="text-center w-10 h-10 bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center rounded-lg">
                   PDF
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800 text-ellipsis overflow-hidden whitespace-nowrap w-40">Scanned Utility Bill.pdf</p>
                  <p className="text-[10px] items-center text-slate-500 font-medium mt-0.5">AI Processed via Gemini Flash</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 font-bold text-[10px] rounded-md">Valid</span>
              </div>

            </div>
            
            <p className="text-[11px] text-slate-400 font-medium mt-auto pt-4 flex items-center gap-1.5 border-t border-slate-200/60">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>
               Documents used for calculations
            </p>
          </div>
        </div>

        {/* COLUMN 2: Middle - Alerts & Actions */}
        <div className="space-y-6 flex flex-col">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-lg font-extrabold text-slate-800">Insights & Actions</h2>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold rounded-md">1 concern</span>
              <span className="px-2 py-0.5 bg-yellow-50 border border-yellow-100 text-yellow-600 text-[10px] font-bold rounded-md">{suggestiveMeasures.length} measures</span>
            </div>
          </div>

          {/* Area of Concern */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm relative pt-14 break-inside-avoid">
             <div className="absolute top-5 left-5 w-8 h-8 rounded-full bg-red-100 text-red-500 flex flex-col items-center justify-center font-bold">!</div>
             <div className="absolute top-5 right-5">
               <button className="bg-red-600 hover:bg-red-700 transition text-white px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-sm flex items-center gap-1">
                 View Breakdown →
               </button>
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-2 leading-snug">Primary Area of Concern</h4>
             <p className="text-xs text-red-800/80 font-medium leading-relaxed pr-6">
                Your largest emission source is <strong className="text-red-900 border-b border-red-300">{primaryConcern}</strong>. By focusing reduction efforts on this category, you can achieve the highest ROI for your net-zero goals.
             </p>
          </div>

          {/* Suggestive Measures */}
          {suggestiveMeasures.map((measure, i) => (
            <div key={i} className="bg-yellow-50/50 border border-yellow-200 rounded-2xl p-5 shadow-sm relative pt-14 break-inside-avoid">
               <div className="absolute top-5 left-5 w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex flex-col items-center justify-center font-bold border border-yellow-200">
                 ✓
               </div>
               <div className="absolute top-5 right-5">
                 <button className="bg-yellow-500 hover:bg-yellow-600 transition text-white px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-sm flex items-center gap-1">
                   Explore Strategy
                 </button>
               </div>
               <h4 className="text-sm font-bold text-slate-800 mb-2 leading-snug">Suggestive Measure #{i+1}</h4>
               <p className="text-xs text-yellow-800/80 font-medium leading-relaxed pr-6">
                 {measure}
               </p>
            </div>
          ))}
        </div>

        {/* COLUMN 3: Right */}
        <div className="space-y-6 flex flex-col">
          
          {/* Card 1: Top Right Area Chart */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 pb-8 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Emissions Flow</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Graphical projection</p>
              </div>
            </div>

            {/* Smooth SVG chart matching the reference */}
            <div className="w-full h-28 relative my-4">
               {/* Red dashed line */}
               <svg viewBox="0 0 400 100" className="absolute inset-0 w-full h-full preserve-3d" preserveAspectRatio="none">
                 <path d="M0,70 C100,60 150,25 200,20 C250,15 300,50 400,45" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />
               </svg>
               {/* Green solid line + gradient area */}
               <svg viewBox="0 0 400 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                 <defs>
                   <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                     <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
                   </linearGradient>
                 </defs>
                 <path d="M0,50 C100,40 150,10 200,10 C250,10 300,60 400,30" fill="none" stroke="#10b981" strokeWidth="2" />
                 <path d="M0,50 C100,40 150,10 200,10 C250,10 300,60 400,30 L400,100 L0,100 Z" fill="url(#chartGrad)" />
               </svg>
               {/* X axis labels */}
               <div className="absolute -bottom-8 left-0 w-full flex justify-between text-[9px] font-bold text-slate-300 uppercase px-6">
                 <span>Q1</span>
                 <span>Q2</span>
                 <span>Q3</span>
                 <span>Q4</span>
               </div>
            </div>

            {/* Footer metrics */}
            <div className="mt-auto grid grid-cols-3 pt-6 w-full text-left gap-2 relative z-10 bg-white">
               <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total TCO2e</p>
                  <p className="text-base font-extrabold text-brand-ink leading-tight mt-1">{total.toLocaleString()}t</p>
               </div>
               <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Scope 1</p>
                  <p className="text-base font-bold text-yellow-600 leading-tight mt-1">{emissions.scope1.toLocaleString()}t</p>
               </div>
               <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Scope 2+3</p>
                  <p className="text-base font-bold text-emerald-600 leading-tight mt-1 border-b border-dashed border-emerald-400 inline-block pb-0.5">{(emissions.scope2 + emissions.scope3).toLocaleString()}t</p>
               </div>
            </div>
          </div>

          {/* Card 2: Top Sources List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1 pb-4">
             <div className="p-6 border-b border-slate-50 flex justify-between items-start">
               <div>
                 <h3 className="text-base font-extrabold text-slate-800 leading-tight">Inventory Breakdown</h3>
                 <p className="text-[11px] text-slate-400 font-medium mt-1">Highest emitting facilities & vehicles</p>
               </div>
             </div>

             <div className="px-6 py-2 flex-1 space-y-4 overflow-y-auto">
                {topSources.length > 0 ? topSources.map((source, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-extrabold text-sm uppercase">
                         {source.name.charAt(0)}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-800 w-32 whitespace-nowrap overflow-hidden text-ellipsis">{source.name}</p>
                         <p className="text-[11px] text-slate-400 font-medium">{source.type}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-slate-800">{source.val > 0 ? `${source.val.toLocaleString()} kWh`: '-'}</p>
                       <p className={cx("text-[10px] px-1.5 rounded font-bold tracking-wide mt-0.5 inline-block", source.type === 'Facility' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600')}>{source.type === 'Facility' ? 'Scope 2' : 'Scope 1'}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-400 italic text-sm py-4 text-center">No facilities or vehicles tracked yet.</p>
                )}
             </div>

             <div className="px-6 pb-2">
                <button className="w-full bg-[#1e293b] hover:bg-[#0f172a] transition text-white rounded-xl py-3 text-sm font-bold shadow-md flex justify-center items-center gap-2">
                  View Full Inventory
                </button>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};
