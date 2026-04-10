import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { useAuthStore } from './store/authStore';
import { AuthPage } from './pages/AuthPage';
import { EmployeePage } from './pages/EmployeePage';
import { CompanyPage } from './pages/CompanyPage';
import { FarmerPage } from './pages/FarmerPage';

const DashboardRoute = () => {
  const profile = useAuthStore((state) => state.userProfile);

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  if (profile.role === 'employee') {
    return <EmployeePage profile={profile} />;
  }
  if (profile.role === 'company') {
    return <CompanyPage profile={profile} />;
  }
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
    return <LoadingSpinner label="Preparing BCX workspace..." />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={userProfile ? '/dashboard' : '/auth'} replace />} />
      <Route
        path="/auth"
        element={userProfile ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
