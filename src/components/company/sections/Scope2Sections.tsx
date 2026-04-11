import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../../hooks/useToast';
import {
  canScanElectricityBills,
  scanElectricityBill,
  toAnnualizedKwh,
  type ElectricityBillExtraction,
  type PreprocessedBillImage,
} from '../../../lib/electricityBillScanner';
import { useCompanyInputStore } from '../../../store/companyInputStore';
import { BulkUploadBar } from './BulkUploadBar';
const SectionHeader = ({ title, desc, badge, children }: { title: string; desc: string; badge: string; children?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
        {badge}
      </span>
      <h2 className="mt-2 text-xl font-extrabold text-brand-ink">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">{desc}</p>
    </div>
    {children && <div className="shrink-0 pt-1">{children}</div>}
  </div>
);

const toNumber = (value: string, fallback = 0) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const fieldOrder: Array<keyof ElectricityBillExtraction['json']> = [
  'rr_number',
  'consumer_name',
  'bill_date',
  'net_payable',
  'due_date',
  'consumed_units_kwh',
  'present_reading',
  'previous_reading',
  'subsidy_status',
  'subsidy_amount',
];

const fieldLabels: Record<keyof ElectricityBillExtraction['json'], string> = {
  rr_number: 'RR Number',
  consumer_name: 'Consumer Name',
  bill_date: 'Bill Date',
  net_payable: 'Net Payable',
  due_date: 'Due Date',
  consumed_units_kwh: 'Consumed Units (kWh)',
  present_reading: 'Present Reading',
  previous_reading: 'Previous Reading',
  subsidy_status: 'Subsidy Status',
  subsidy_amount: 'Subsidy Amount',
};

const Field = ({
  id,
  label,
  unit,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
      {label}
    </label>
    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/15">
      <input
        id={id}
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="flex-1 bg-transparent px-3 py-2.5 text-sm font-semibold text-brand-ink outline-none placeholder:font-normal placeholder:text-slate-300"
      />
      <span className="flex items-center border-l border-slate-100 bg-slate-50 px-3 text-xs font-medium text-slate-500">
        {unit}
      </span>
    </div>
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

export const Scope2ElecSection = () => {
  const { scope2, updateScope2, emissions } = useCompanyInputStore();
  const { pushToast } = useToast();

  const uploadRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanUsedFallback, setScanUsedFallback] = useState(false);
  const [preview, setPreview] = useState<PreprocessedBillImage | null>(null);
  const [scanPreviewUrl, setScanPreviewUrl] = useState('');
  const [extraction, setExtraction] = useState<ElectricityBillExtraction | null>(null);
  const [billingMonths, setBillingMonths] = useState('1');
  const [fallbackUnitsKwh, setFallbackUnitsKwh] = useState('');
  const scanPreviewUrlRef = useRef<string | null>(null);

  const renewablePct = Math.min(100, Math.max(0, toNumber(scope2.renewablePercent, 0)));
  const gridFraction = 1 - renewablePct / 100;

  const scannedUnits = extraction?.consumedUnitsKwh ?? 0;
  const unitsForCalculation = scannedUnits > 0 ? scannedUnits : Math.max(0, toNumber(fallbackUnitsKwh, 0));
  const annualizedKwh = toAnnualizedKwh(unitsForCalculation, Math.max(1, Math.min(12, toNumber(billingMonths, 1))));

  useEffect(() => {
    return () => {
      if (scanPreviewUrlRef.current) {
        URL.revokeObjectURL(scanPreviewUrlRef.current);
        scanPreviewUrlRef.current = null;
      }
    };
  }, []);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScanError('Please upload a bill image (PNG/JPG/JPEG).');
      pushToast('Only bill images are supported in this flow.', 'error');
      return;
    }

    setIsScanning(true);
    setScanError('');
    setScanUsedFallback(false);
    setExtraction(null);
    setPreview(null);
    setFallbackUnitsKwh('');

    if (scanPreviewUrlRef.current) {
      URL.revokeObjectURL(scanPreviewUrlRef.current);
      scanPreviewUrlRef.current = null;
    }
    const livePreviewUrl = URL.createObjectURL(file);
    scanPreviewUrlRef.current = livePreviewUrl;
    setScanPreviewUrl(livePreviewUrl);

    try {
      const result = await scanElectricityBill(file);
      setPreview(result.preprocessedImage);
      setExtraction(result.extraction);
      setScanUsedFallback(result.usedFallback);

      if (result.extraction.consumedUnitsKwh > 0) {
        pushToast(`Bill scanned successfully. Detected ${result.extraction.consumedUnitsKwh.toFixed(2)} kWh usage.`, 'success');
      } else {
        pushToast('Scan completed, but units were unclear. Please use fallback units input.', 'info');
      }

      if (result.usedFallback) {
        pushToast('Scanner used fallback parsing due to a strict JSON failure.', 'info');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bill scan failed.';
      setScanError(message);
      pushToast(message, 'error');
    } finally {
      setIsScanning(false);
      if (scanPreviewUrlRef.current) {
        URL.revokeObjectURL(scanPreviewUrlRef.current);
        scanPreviewUrlRef.current = null;
      }
      setScanPreviewUrl('');
    }
  };

  const applyToCalculation = () => {
    if (annualizedKwh <= 0) {
      pushToast('Could not compute annualized kWh. Please review scan values.', 'error');
      return;
    }

    updateScope2({ electricityKwh: String(annualizedKwh) });
    pushToast(`Applied ${annualizedKwh.toLocaleString('en-IN')} annualized kWh to Scope 2 calculation.`, 'success');
  };

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes bill-scan-sweep {
          0% { top: 2%; opacity: 0; }
          8% { opacity: 1; }
          50% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 94%; opacity: 0; }
        }
        @keyframes bill-scan-glow {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.7; }
        }
      `}</style>
      <SectionHeader
        badge="Scope 2 - Indirect"
        title="Electricity Bill Scanner"
        desc="Phased orchestration: upload Karnataka bill image, validate extracted JSON with bounding boxes, then apply annualized electricity and renewable percentage to Scope 2 calculations."
      >
        <BulkUploadBar bulkType="locations" sampleFile="location_template.xlsx" downloadName="bcx_locations_template.xlsx" />
      </SectionHeader>

      {!canScanElectricityBills() && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-700">
            Gemini scanning is disabled. Add `VITE_GEMINI_API_KEY` in `.env` to enable bill OCR extraction.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Phase 1 - Upload & Preprocess</p>
        <p className="mt-1 text-sm text-slate-500">
          The image is automatically cropped, resized, and contrast-enhanced before extraction.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleUpload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => uploadRef.current?.click()}
            disabled={isScanning || !canScanElectricityBills()}
            className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-ember disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isScanning ? 'Scanning bill...' : 'Upload Bill Image'}
          </button>
          {preview && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Preprocessed: {preview.width} x {preview.height}
            </span>
          )}
          {scanUsedFallback && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Fallback parser used
            </span>
          )}
        </div>
        {scanError && <p className="mt-3 text-sm font-medium text-red-600">{scanError}</p>}
        {isScanning && scanPreviewUrl && (
          <div className="mt-4 overflow-hidden rounded-xl border border-cyan-100 bg-slate-950/95">
            <div className="relative">
              <img
                src={scanPreviewUrl}
                alt="Bill scan preview"
                className="block max-h-[340px] w-full object-contain opacity-90"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cyan-300/10 to-transparent"
                style={{ animation: 'bill-scan-glow 1.6s ease-in-out infinite' }}
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-80"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, rgba(14,165,233,0.00), rgba(14,165,233,0.00) 8px, rgba(14,165,233,0.10) 9px)',
                }}
              />
              <div
                className="pointer-events-none absolute left-0 right-0 h-[2px] bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.95)]"
                style={{ animation: 'bill-scan-sweep 1.8s linear infinite' }}
              />
              <div className="pointer-events-none absolute inset-x-0 top-3 flex items-center justify-center">
                <span className="rounded-full border border-cyan-200/70 bg-cyan-300/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100">
                  Scanning Bill
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {preview && extraction && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Phase 2 - Validate Extraction</p>
            <p className="mt-1 text-sm text-slate-500">Bounding boxes are drawn over extracted fields for quick verification.</p>

            <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200">
              <img src={preview.previewDataUrl} alt="Preprocessed bill preview" className="block w-full" />
              {extraction.boxes.map((bbox, index) => {
                const [x1, y1, x2, y2] = bbox.box;
                return (
                  <div
                    key={`${bbox.field}-${index}`}
                    className="absolute border-2 border-emerald-500 bg-emerald-300/10"
                    style={{
                      left: `${(x1 / 1000) * 100}%`,
                      top: `${(y1 / 1000) * 100}%`,
                      width: `${((x2 - x1) / 1000) * 100}%`,
                      height: `${((y2 - y1) / 1000) * 100}%`,
                    }}
                    title={`${bbox.field}: ${bbox.value}`}
                  />
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {fieldOrder.map((field) => (
                <div key={field} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{fieldLabels[field]}</p>
                  <p className="mt-1 text-sm font-semibold text-brand-ink">{extraction.json[field] || '--'}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Structured JSON (integration-ready)</p>
              <pre className="mt-2 max-h-48 overflow-auto text-xs leading-relaxed text-slate-700">
{JSON.stringify(
  {
    rr_number: extraction.json.rr_number,
    consumer_name: extraction.json.consumer_name,
    bill_date: extraction.json.bill_date,
    net_payable: extraction.json.net_payable,
    due_date: extraction.json.due_date,
    consumed_units_kwh: extraction.json.consumed_units_kwh,
    present_reading: extraction.json.present_reading,
    previous_reading: extraction.json.previous_reading,
    subsidy_status: extraction.json.subsidy_status,
    subsidy_amount: extraction.json.subsidy_amount,
  },
  null,
  2,
)}
              </pre>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Phase 3 - Apply For Calculation</p>
              <p className="mt-1 text-sm text-slate-500">
                Only calculation-critical values are applied: annualized electricity and renewable percentage.
              </p>

              <div className="mt-4 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="billing-months" className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Billing Period Covered
                  </label>
                  <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <input
                      id="billing-months"
                      type="number"
                      min="1"
                      max="12"
                      value={billingMonths}
                      onChange={(e) => setBillingMonths(e.target.value)}
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm font-semibold text-brand-ink outline-none"
                    />
                    <span className="flex items-center border-l border-slate-100 bg-slate-50 px-3 text-xs font-medium text-slate-500">
                      months
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Use `1` for a monthly bill.</p>
                </div>

                {scannedUnits <= 0 && (
                  <div className="space-y-1">
                    <label htmlFor="fallback-units" className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Fallback Units (if OCR missed)
                    </label>
                    <div className="flex overflow-hidden rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
                      <input
                        id="fallback-units"
                        type="number"
                        min="0"
                        value={fallbackUnitsKwh}
                        onChange={(e) => setFallbackUnitsKwh(e.target.value)}
                        placeholder="Enter consumed units from bill"
                        className="flex-1 bg-transparent px-3 py-2.5 text-sm font-semibold text-brand-ink outline-none placeholder:font-normal placeholder:text-slate-400"
                      />
                      <span className="flex items-center border-l border-amber-100 bg-amber-100/70 px-3 text-xs font-medium text-amber-700">
                        kWh
                      </span>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-500">Annualized Electricity</p>
                  <p className="mt-1 text-2xl font-extrabold text-blue-700">
                    {annualizedKwh.toLocaleString('en-IN')} kWh
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    Source units: {unitsForCalculation.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kWh
                  </p>
                </div>

                <button
                  onClick={applyToCalculation}
                  disabled={annualizedKwh <= 0}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply Annualized kWh to Scope 2
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <label htmlFor="s2-renewable" className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Renewable Energy Acceptance (%)
              </label>
              <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/15">
                <input
                  id="s2-renewable"
                  type="range"
                  min="0"
                  max="100"
                  value={scope2.renewablePercent || '0'}
                  onChange={(e) => updateScope2({ renewablePercent: e.target.value })}
                  className="flex-1 accent-blue-500 px-3 py-2.5"
                />
                <span className="flex min-w-[52px] items-center justify-center border-l border-slate-100 bg-slate-50 px-3 text-xs font-bold text-blue-600">
                  {Math.round(toNumber(scope2.renewablePercent, 0))}%
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {renewablePct > 0
                  ? `${renewablePct}% renewable -> ${Math.round(gridFraction * 100)}% grid electricity counted for Scope 2`
                  : 'Set renewable share used for market-based Scope 2 deduction'}
              </p>

              {toNumber(scope2.electricityKwh, 0) > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Grid electricity (Scope 2)</span>
                    <span>Renewable (excluded)</span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="bg-blue-400 transition-all" style={{ width: `${100 - renewablePct}%` }} />
                    <div className="bg-emerald-400 transition-all" style={{ width: `${renewablePct}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {emissions.scope2 > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-500">Scope 2 Total</p>
          <p className="mt-1 text-3xl font-extrabold text-blue-600">
            {emissions.scope2.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCO2e
          </p>
          <p className="mt-1 text-xs text-blue-400">Market-based, renewable deducted</p>
        </div>
      )}
    </div>
  );
};

export const Scope2HeatingSection = () => {
  const { scope2, updateScope2, emissions } = useCompanyInputStore();

  return (
    <div className="space-y-8">
      <SectionHeader
        badge="Scope 2 - Indirect"
        title="Heating & Cooling"
        desc="District heating, steam, and cooling purchased from external sources."
      >
        <BulkUploadBar bulkType="locations" sampleFile="location_template.xlsx" downloadName="bcx_locations_template.xlsx" />
      </SectionHeader>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field
          id="s2-heating"
          label="Purchased Heating / Cooling"
          unit="kWh"
          value={scope2.heatingKwh}
          onChange={(v) => updateScope2({ heatingKwh: v })}
          hint="Energy purchased as heat, steam, or chilled water (not covered by electricity meter)"
        />
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-500">Scope 2 Total (all sources)</p>
        <p className="mt-1 text-3xl font-extrabold text-blue-600">
          {emissions.scope2.toLocaleString('en-IN', { maximumFractionDigits: 2 })} tCO2e
        </p>
      </div>
    </div>
  );
};
