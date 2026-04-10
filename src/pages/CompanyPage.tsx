import { CompanyDashboard } from '../components/company/CompanyDashboard';
import { Topbar } from '../components/shared/Topbar';
import type { UserProfile } from '../types';

export const CompanyPage = ({ profile }: { profile: UserProfile }) => (
  <div className="min-h-screen bg-brand-mist pb-safe">
    <Topbar
      title="BCX | Bharat Carbon Exchange"
      roleLabel="Company"
      avatarText={profile.name.slice(0, 1).toUpperCase()}
    />
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <CompanyDashboard profile={profile} />
    </main>
  </div>
);
