import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { useAuthStore } from './store/authStore';
import { SplashPage } from './pages/SplashPage';
import { RoleSelectorPage } from './pages/RoleSelectorPage';
import { AuthPage } from './pages/AuthPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { EmployeePage } from './pages/EmployeePage';
import { CompanyPage } from './pages/CompanyPage';
import { FarmerPage } from './pages/FarmerPage';

const DashboardRoute = () => {
  const profile = useAuthStore((state) => state.userProfile);

  if (!profile) return <Navigate to="/auth" replace />;

  // New users without complete profile → send to setup
  if (!profile.profileComplete) return <Navigate to="/onboarding" replace />;

  if (profile.role === 'employee') return <EmployeePage profile={profile} />;
  if (profile.role === 'company') return <CompanyPage profile={profile} />;
  return <FarmerPage profile={profile} />;
};

export const App = () => {
  const { onAuthStateChange, loading, authReady, userProfile } = useAuthStore(
    useShallow((state) => ({
      onAuthStateChange: state.onAuthStateChange,
      loading: state.loading,
      authReady: state.authReady,
      userProfile: state.userProfile
    }))
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChange();
    return unsubscribe;
  }, [onAuthStateChange]);

  if (!authReady || loading) {
    return <LoadingSpinner label="Preparing BCX workspace…" />;
  }

  return (
    <Routes>
      {/* Entry → splash (if not logged in) or dashboard */}
      <Route
        path="/"
        element={<Navigate to={userProfile ? '/dashboard' : '/splash'} replace />}
      />

      {/* Splash screens */}
      <Route path="/splash" element={<SplashPage />} />

      {/* Role selector */}
      <Route path="/role" element={<RoleSelectorPage />} />

      {/* Auth (login / signup) */}
      <Route
        path="/auth"
        element={userProfile ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />

      {/* Profile setup wizard */}
      <Route
        path="/onboarding"
        element={
          !userProfile ? (
            <Navigate to="/auth" replace />
          ) : userProfile.profileComplete ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <ProfileSetupPage />
          )
        }
      />

      {/* Dashboard (role-gated) */}
      <Route path="/dashboard" element={<DashboardRoute />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
