import { useEffect, useState } from 'react';
import { useIotStore } from '../../../store/iotStore';

export const IoTConnectorsSection = () => {
  const { apiKey, webhookUrl, isConnected, generateCredentials, toggleConnection } = useIotStore();
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    if (apiKey) {
      void navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700">
          Real-Time Telemetry
        </span>
        <h2 className="mt-2 text-xl font-extrabold text-brand-ink">IoT Connectors & APIs</h2>
        <p className="mt-1 max-w-xl text-sm text-slate-500">
          Generate API keys and configure webhooks to stream live, continuous telemetry data from your factory equipment, BMS, or data center servers directly into BCX.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-brand-ink mb-4">Connection Credentials</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Webhook Ingestion URL</label>
                <div className="flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <code className="text-sm text-slate-600 px-4 py-3 flex-1">{webhookUrl}</code>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bearer API Key</label>
                {apiKey ? (
                  <div className="flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <code className="text-sm text-slate-800 font-bold px-4 py-3 flex-1">{apiKey}</code>
                    <button onClick={copyKey} className="px-4 border-l border-slate-200 hover:bg-slate-100 transition text-sm font-semibold text-brand-orange">
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <button onClick={generateCredentials} className="px-4 py-2.5 border-2 border-dashed border-cyan-200 text-cyan-600 rounded-xl text-sm font-bold hover:bg-cyan-50 transition w-full">
                    Generate Secret Key
                  </button>
                )}
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">Keep this key secret. It provides write-only access to your company's telemetry pipeline.</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-brand-ink">Data Integration Architecture</h3>
            </div>
            
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>BCX accepts continuous push data from automated machinery to calculate precise carbon integration. We recommend streaming data at interval resolutions of <strong>5 seconds to 1 minute</strong>.</p>
              
              <div className="bg-slate-800 text-cyan-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                <p>{`POST ${webhookUrl}`}</p>
                <p>Authorization: Bearer {'<YOUR_API_KEY>'}</p>
                <br/>
                <p>{'{'}</p>
                <p className="pl-4">{`"equipmentId": "CNC-04",`}</p>
                <p className="pl-4">{`"timestamp": "2026-04-11T01:15:00Z",`}</p>
                <p className="pl-4">{`"metrics": {`}</p>
                <p className="pl-8">{`"power_kw": 24.5,`}</p>
                <p className="pl-8">{`"status": "active"`}</p>
                <p className="pl-4">{`}`}</p>
                <p>{`}`}</p>
              </div>

              <p>The BCX integration engine applies a real-time Riemann sum against your instantaneous power load to dynamically calculate accumulated kWh and resulting tCO₂e impact.</p>
            </div>
          </section>
        </div>

        <div>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
            <h3 className="text-sm font-bold text-brand-ink mb-1">Simulator Status</h3>
            <p className="text-xs text-slate-500 mb-6">For demo/hackathon review</p>

            <div className="flex flex-col gap-4">
              <div className={`p-4 rounded-xl border ${isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  </span>
                  <p className="font-bold text-sm uppercase tracking-wider">{isConnected ? 'Data Streaming active' : 'Simulator Offline'}</p>
                </div>
                {isConnected && <p className="mt-2 text-xs opacity-80">Receiving synthetic telemetry from 3 simulated hardware sources at 1 Hz.</p>}
              </div>

              <button
                disabled={!apiKey}
                onClick={toggleConnection}
                className={`py-3 rounded-xl font-bold transition shadow-sm ${isConnected ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50'}`}
              >
                {isConnected ? 'Disconnect Simulator' : 'Start Mock Data Stream'}
              </button>

              {!apiKey && (
                <p className="text-[10px] text-center text-slate-400">Generate an API key first to start the simulator.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
