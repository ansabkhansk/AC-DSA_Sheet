import { Link, NavLink } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuthStore } from '../../features/auth/store';
import { logout as logoutRequest } from '../../features/auth/api';
import { Button } from '../ui/Button';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-semibold text-accent no-underline' : 'text-muted no-underline hover:text-text';

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
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-4 sm:gap-6">
          <Link to="/sheet" className="text-base font-semibold text-text no-underline">
            DSA Sheet
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <NavLink to="/sheet" className={navLinkClass}>
              Sheet
            </NavLink>
            {user ? (
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
            ) : null}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
