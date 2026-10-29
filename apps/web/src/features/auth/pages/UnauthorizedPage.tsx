import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export function UnauthorizedPage() {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  const loginTo = `/login?from=${encodeURIComponent(from === '/401' ? '/dashboard' : from)}`;

  return (
    <section className="mx-auto max-w-lg rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Sign in required</h1>
      <p className="mt-3 text-muted">
        You need to sign in to view this page. Your destination will be restored after login when
        possible.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to={loginTo}>
          <Button>Sign in</Button>
        </Link>
        <Link to="/">
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </section>
  );
}
