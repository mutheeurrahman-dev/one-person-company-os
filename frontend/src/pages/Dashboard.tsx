import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  IndianRupee,
  ShoppingCart,
  ListChecks,
  PackageX,
  ShieldAlert,
  Send,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { dashboardApi, commandApi } from '../lib/endpoints';
import { useAgentActivityFeed } from '../hooks/useAgentActivityFeed';
import { AGENT_META, ALL_AGENTS, agentLabel } from '../lib/agents';
import { AgentDot } from '../components/AgentDot';
import { Card, PageLoading, ErrorBanner, Button, Badge, statusTone, EmptyState } from '../components/ui';
import { apiErrorMessage } from '../lib/api';
import type { DashboardResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';

const EXAMPLE_COMMANDS = [
  'Sell 2 Shirts to Priya Sharma',
  'Check for low stock items',
  'Record a ₹1200 expense for packaging supplies',
  'Propose a marketing campaign for the Kurta',
];

export default function Dashboard() {
  const { business } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [command, setCommand] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const { events, state } = useAgentActivityFeed(true, 100);
  const feedEndRef = useRef<HTMLDivElement>(null);

  async function loadDashboard() {
    try {
      const res = await dashboardApi.get();
      setData(res);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // Refresh dashboard stats whenever a workflow completes/fails, since agent
  // work changes revenue, orders, stock, and approvals.
  useEffect(() => {
    const last = events[events.length - 1];
    if (last && (last.status === 'success' || last.status === 'failed') && last.agent === 'manager_agent') {
      loadDashboard();
    }
  }, [events]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  async function handleSubmitCommand(e: FormEvent) {
    e.preventDefault();
    setCommandError(null);
    setLastResult(null);
    if (!command.trim()) {
      setCommandError('Type a command for your agents first.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await commandApi.submit(command.trim());
      setLastResult(result.summary || `Workflow ${result.status}.`);
      setCommand('');
    } catch (err) {
      setCommandError(apiErrorMessage(err, 'Could not submit that command.'));
    } finally {
      setSubmitting(false);
    }
  }

  const activeAgentSet = new Set(data?.active_agents ?? []);

  if (loading) return <PageLoading label="Loading your dashboard…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Good to see you{business ? `, ${business.name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted">Here's what your agents have been up to.</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Command Console */}
      <Card className="console-grid overflow-hidden">
        <div className="bg-raised/70 p-5 lg:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-display text-sm font-semibold text-ink">AI Command Box</span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-muted">
              {state === 'open' ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-success" /> live feed connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-danger" /> reconnecting…
                </>
              )}
            </span>
          </div>

          <form onSubmit={handleSubmitCommand} className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-ink focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <span className="text-accent">$</span>
              <input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Tell your agents what to do…"
                className="flex-1 bg-transparent outline-none placeholder:text-muted"
                disabled={submitting}
              />
            </div>
            <Button type="submit" loading={submitting} className="shrink-0">
              <Send className="h-4 w-4" />
              Execute
            </Button>
          </form>

          {commandError && <p className="mt-2 text-xs text-danger">{commandError}</p>}
          {lastResult && !commandError && (
            <p className="mt-2 text-xs text-success">{lastResult}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_COMMANDS.map((c) => (
              <button
                key={c}
                onClick={() => setCommand(c)}
                type="button"
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Agent readiness row */}
          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
            {ALL_AGENTS.map((agent) => (
              <div key={agent} className="flex items-center gap-1.5 text-xs text-muted">
                <AgentDot colorVar={AGENT_META[agent].colorVar} active={activeAgentSet.has(agent)} />
                {agentLabel(agent)}
                {activeAgentSet.has(agent) && <span className="text-[10px] text-ink/70">working…</span>}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile
          icon={IndianRupee}
          label="Today's revenue"
          value={formatCurrency(data?.today_revenue ?? 0)}
          iconWrapClass="bg-finance/10"
          iconClass="text-finance"
        />
        <StatTile
          icon={ShoppingCart}
          label="Total orders"
          value={String(data?.total_orders ?? 0)}
          iconWrapClass="bg-operations/10"
          iconClass="text-operations"
        />
        <StatTile
          icon={ListChecks}
          label="Pending tasks"
          value={String(data?.pending_tasks ?? 0)}
          iconWrapClass="bg-manager/10"
          iconClass="text-manager"
        />
        <StatTile
          icon={PackageX}
          label="Low stock"
          value={String(data?.low_stock_count ?? 0)}
          iconWrapClass="bg-danger/10"
          iconClass="text-danger"
        />
        <StatTile
          icon={ShieldAlert}
          label="Approvals needed"
          value={String(data?.pending_approvals ?? 0)}
          iconWrapClass="bg-accent/10"
          iconClass="text-accent"
        />
        <StatTile
          icon={ListChecks}
          label="Active agents"
          value={String(data?.active_agents.length ?? 0)}
          iconWrapClass="bg-customer/10"
          iconClass="text-customer"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Live activity feed */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-ink">Live agent activity</h2>
            <Badge tone={state === 'open' ? 'success' : 'neutral'}>{state === 'open' ? 'Live' : state}</Badge>
          </div>
          <div className="max-h-96 overflow-y-auto px-5 py-4">
            {events.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Run a command above and watch your agents work in real time."
              />
            ) : (
              <ul className="space-y-3 font-mono text-xs">
                {events.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-2.5">
                    <AgentDot colorVar={AGENT_META[ev.agent]?.colorVar ?? 'muted'} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{agentLabel(ev.agent)}</span>
                        <Badge tone={statusTone(ev.status)}>{ev.status}</Badge>
                        <span className="ml-auto shrink-0 text-[10px] text-muted">
                          {new Date(ev.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-0.5 break-words text-muted">{ev.message}</p>
                    </div>
                  </li>
                ))}
                <div ref={feedEndRef} />
              </ul>
            )}
          </div>
        </Card>

        {/* Recent customer activity */}
        <Card className="lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-ink">Recent customer activity</h2>
          </div>
          <div className="px-5 py-4">
            {!data?.recent_customer_activity.length ? (
              <EmptyState title="No customers yet" description="Customers show up here as your agents create them." />
            ) : (
              <ul className="space-y-2">
                {data.recent_customer_activity.map((name, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg border border-border bg-raised/50 px-3 py-2.5 text-sm text-ink">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-customer/15 text-xs font-semibold text-customer">
                      {name[0]?.toUpperCase()}
                    </div>
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  iconWrapClass,
  iconClass,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  iconWrapClass: string;
  iconClass: string;
}) {
  return (
    <Card className="p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconWrapClass}`}>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>
      <p className="font-display text-xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </Card>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
