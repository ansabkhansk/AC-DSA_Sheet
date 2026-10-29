import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../store';

export function NotFoundPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <section className="mx-auto max-w-lg rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Page not found</h1>
      <p className="mt-3 text-muted">The page you requested could not be found.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/sheet">
          <Button>Back to sheet</Button>
        </Link>
        {user ? (
          <Link to="/dashboard">
            <Button variant="secondary">Dashboard</Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button variant="secondary">Sign in</Button>
          </Link>
        )}
      </div>
    </section>
  );
}
