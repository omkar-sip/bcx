export const LoadingSpinner = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-soft">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
      <span className="text-sm font-semibold text-brand-ink">{label}</span>
    </div>
  </div>
);
