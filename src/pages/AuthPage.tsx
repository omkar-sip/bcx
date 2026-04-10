import { useState } from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';

export const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { pushToast } = useToast();
  const loading = useAuthStore((state) => state.loading);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);

  return (
    <AuthLayout>
      {mode === 'login' ? (
        <LoginForm
          loading={loading}
          onSwitch={() => setMode('signup')}
          onSubmit={async ({ email, password }) => {
            try {
              await signIn(email, password);
              pushToast('Signed in successfully.', 'success');
            } catch (error) {
              pushToast(
                error instanceof Error ? error.message : 'Unable to sign in right now.',
                'error'
              );
            }
          }}
        />
      ) : (
        <SignupForm
          loading={loading}
          onSwitch={() => setMode('login')}
          onSubmit={async (payload) => {
            try {
              await signUp(payload);
              pushToast('Account created successfully.', 'success');
            } catch (error) {
              pushToast(
                error instanceof Error ? error.message : 'Unable to create account right now.',
                'error'
              );
            }
          }}
        />
      )}
    </AuthLayout>
  );
};
