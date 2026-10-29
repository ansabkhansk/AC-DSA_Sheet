import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { fetchMe } from '../features/auth/api';
import { useAuthStore } from '../features/auth/store';
import { queryClient } from './queryClient';

function AuthBootstrap({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setStatus('loading');
      try {
        const user = await fetchMe();
        if (!cancelled) {
          setUser(user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setStatus, setUser]);

  return children;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </QueryClientProvider>
  );
}
