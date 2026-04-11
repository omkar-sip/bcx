/**
 * BulkUploadBar – reusable inline bar with "Bulk Upload" + "Sample File" buttons.
 * Mirrors the exact behaviour from the Home page StartCards.
 */
import { useRef } from 'react';
import { useToast } from '../../../hooks/useToast';
import { parseBulkExcel, mapExcelToStore, type ParsedBulkData } from '../../../lib/bulkParser';
import { downloadResource } from '../../../lib/utils';
import { useCompanyInputStore } from '../../../store/companyInputStore';

interface BulkUploadBarProps {
  bulkType: ParsedBulkData['type'];
  sampleFile: string;
  downloadName: string;
}

export const BulkUploadBar = ({ bulkType, sampleFile, downloadName }: BulkUploadBarProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { pushToast } = useToast();
  const loadBulkData = useCompanyInputStore((s) => s.loadBulkData);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        pushToast(`Parsing ${file.name}...`, 'info');
        const parsed = await parseBulkExcel(file, bulkType);
        const mapped = mapExcelToStore(parsed.type, parsed.data);

        if (mapped.length > 0) {
          loadBulkData(parsed.type, mapped);
          pushToast(`Successfully uploaded ${mapped.length} items to ${parsed.type}.`, 'success');
        } else {
          pushToast('No valid data found in file.', 'error');
        }
      } catch (err) {
        console.error(err);
        pushToast('Failed to parse Excel file. Ensure it is a valid .xlsx or .csv', 'error');
      }
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        className="hidden"
        ref={fileRef}
        onChange={handleFile}
        accept=".csv,.xlsx,.xls"
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-sm"
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
          <path
            d="M8 1v10M4 5l4-4 4 4M2 14h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Bulk Upload
      </button>
      <button
        onClick={async () => {
          try {
            await downloadResource(`/home_data_sample/${sampleFile}`, downloadName);
            pushToast(`Download started: ${downloadName}`, 'success');
          } catch {
            pushToast('Failed to download sample file.', 'error');
          }
        }}
        className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-bold text-brand-orange hover:bg-orange-100 transition flex items-center gap-1.5 shadow-sm"
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
          <path
            d="M8 11V1M4 7l4 4 4-4M2 14h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Sample File
      </button>
    </div>
  );
};
