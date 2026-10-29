import { Link, NavLink } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuthStore } from '../../features/auth/store';
import { logout as logoutRequest } from '../../features/auth/api';
import { Button } from '../ui/Button';

export function AppNav() {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);

  async function handleLogout() {
    try {
      await logoutRequest();
    } finally {
      clear();
      window.location.assign('/login');
    }
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            to={user ? '/dashboard' : '/login'}
            className="text-base font-semibold text-text no-underline"
          >
            DSA Sheet
          </Link>
          {user ? (
            <nav className="flex items-center gap-3 text-sm">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive
                    ? 'font-semibold text-accent no-underline'
                    : 'text-muted no-underline hover:text-text'
                }
              >
                Dashboard
              </NavLink>
            </nav>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Button variant="secondary" onClick={() => void handleLogout()}>
              Log out
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Link to="/login" className="no-underline">
                Sign in
              </Link>
              <Link to="/register" className="no-underline">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
