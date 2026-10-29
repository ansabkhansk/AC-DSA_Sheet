import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Spinner } from '../components/ui/Spinner';
import { useAuthStore } from '../features/auth/store';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  if (status === 'idle' || status === 'loading') {
    return <Spinner label="Checking session…" />;
  }

  if (!user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  return children;
}
