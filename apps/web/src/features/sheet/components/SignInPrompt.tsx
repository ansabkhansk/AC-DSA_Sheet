import { Link, useLocation } from 'react-router-dom';

export function SignInPrompt() {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
      Browse freely.{' '}
      <Link to={`/login?from=${encodeURIComponent(from)}`} className="font-semibold text-accent">
        Sign in to track progress
      </Link>
      .
    </div>
  );
}
