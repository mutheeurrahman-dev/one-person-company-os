import { Moon, Sun, LogOut, Building2, Mail, User as UserIcon, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Card } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { AGENT_META, agentLabel, ALL_AGENTS } from '../lib/agents';
import { AgentDot } from '../components/AgentDot';

export default function Settings() {
  const { user, business, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your account, business, and workspace preferences.</p>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink">Account</h2>
        <div className="space-y-3">
          <Row icon={UserIcon} label="Name" value={user?.full_name ?? '—'} />
          <Row icon={Mail} label="Email" value={user?.email ?? '—'} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink">Business</h2>
        <div className="space-y-3">
          <Row icon={Building2} label="Business name" value={business?.name ?? '—'} />
          <Row icon={Building2} label="Industry" value={business?.industry ?? '—'} />
          <Row icon={Building2} label="Currency" value={business?.currency ?? '—'} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink">Theme</p>
            <p className="text-xs text-muted">Switch between light and dark mode.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-ink">
          <Bot className="h-4 w-4" /> Your agent crew
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ALL_AGENTS.map((a) => (
            <div key={a} className="flex items-center gap-2 rounded-lg border border-border bg-raised/50 px-3 py-2 text-sm text-ink">
              <AgentDot colorVar={AGENT_META[a].colorVar} size="md" />
              {agentLabel(a)}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink">Log out</p>
            <p className="text-xs text-muted">You'll need to log back in to reach your dashboard.</p>
          </div>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-raised/40 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted" />
      <span className="w-28 shrink-0 text-xs text-muted">{label}</span>
      <span className="truncate text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
