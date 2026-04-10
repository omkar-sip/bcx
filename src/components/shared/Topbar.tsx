import { useAuthStore } from '../../store/authStore';

interface TopbarProps {
  title: string;
  roleLabel: string;
  avatarText: string;
}

export const Topbar = ({ title, roleLabel, avatarText }: TopbarProps) => {
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-orange text-white">
            BC
          </span>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-brand-ink">{title}</p>
            <p className="text-xs font-medium text-slate-500">{roleLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden rounded-full bg-brand-sand px-3 py-1 text-xs font-semibold text-brand-ember sm:inline-flex">
            {roleLabel}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-orange text-xs font-semibold text-white">
            {avatarText}
          </span>
          <button className="btn-secondary text-xs" type="button" onClick={() => void signOut()}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
