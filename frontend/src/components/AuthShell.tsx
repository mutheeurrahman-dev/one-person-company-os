import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="absolute right-4 top-4">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-ink"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-ink">
            <span className="font-display text-sm font-bold">C</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">Company OS</span>
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-panel">
          <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
