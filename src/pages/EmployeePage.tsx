import { EmployeeDashboard } from '../components/employee/EmployeeDashboard';
import { Topbar } from '../components/shared/Topbar';
import type { UserProfile } from '../types';

export const EmployeePage = ({ profile }: { profile: UserProfile }) => (
  <div className="min-h-screen bg-brand-mist pb-safe">
    <Topbar
      title="BCX | Bharat Carbon Exchange"
      roleLabel={`Employee${profile.company ? ` • ${profile.company}` : ''}`}
      avatarText={profile.name.slice(0, 1).toUpperCase()}
    />
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <EmployeeDashboard profile={profile} />
    </main>
  </div>
);
