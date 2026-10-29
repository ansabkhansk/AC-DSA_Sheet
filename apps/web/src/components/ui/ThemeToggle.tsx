import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document === 'undefined' ? 'light' : readTheme(),
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? 'Switch to dark theme' : 'Switch to light theme';

  return (
    <button
      type="button"
      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text hover:bg-bg"
      aria-pressed={theme === 'dark'}
      aria-label={label}
      onClick={() => setTheme(next)}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
