import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  ShoppingCart,
  Users,
  Wallet,
  Package,
  ShieldCheck,
  Lightbulb,
  Settings as SettingsIcon,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/agent-activity', label: 'Agent Activity', icon: Activity },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/finance', label: 'Finance', icon: Wallet },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
  { to: '/insights', label: 'Insights', icon: Lightbulb },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar - desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <SidebarContent business={business?.name} onNavigate={() => {}} />
      </aside>

      {/* Sidebar - mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-surface">
            <SidebarContent business={business?.name} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 lg:px-8">
          <button
            className="rounded-lg p-2 text-muted hover:bg-raised lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-muted lg:block">
            {business ? <span className="font-medium text-ink">{business.name}</span> : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-ink"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="hidden items-center gap-2 border-l border-border pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="text-sm font-medium text-ink">{user?.full_name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-danger"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ business, onNavigate }: { business?: string; onNavigate: () => void }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-ink">
            <span className="font-display text-sm font-bold">C</span>
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">Company OS</span>
        </div>
        <button className="rounded-lg p-1 text-muted hover:bg-raised lg:hidden" onClick={onNavigate}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-raised hover:text-ink'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border px-5 py-4 text-xs text-muted">
        {business ? <span>{business}</span> : <span>No business linked</span>}
      </div>
    </>
  );
}
