import { Link } from 'react-router-dom';
import { ArrowRight, Bot, ShieldCheck, Activity, Wallet } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const AGENTS = [
  { name: 'Manager', desc: 'Decomposes your request and coordinates every other agent.', colorVar: 'text-manager', bg: 'bg-manager/10' },
  { name: 'Operations', desc: 'Processes orders, checks inventory, keeps stock honest.', colorVar: 'text-operations', bg: 'bg-operations/10' },
  { name: 'Finance', desc: 'Records revenue and expenses, flags anything unusual.', colorVar: 'text-finance', bg: 'bg-finance/10' },
  { name: 'Customer', desc: 'Looks after customers and drafts confirmations.', colorVar: 'text-customer', bg: 'bg-customer/10' },
  { name: 'Marketing', desc: 'Proposes campaigns — nothing spends without your OK.', colorVar: 'text-marketing', bg: 'bg-marketing/10' },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-ink">
            <span className="font-display text-sm font-bold">C</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Company OS</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-ink"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/login" className="text-sm font-medium text-muted hover:text-ink">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink shadow-panel hover:brightness-95"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-raised px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success pulse" />
              5 agents on duty, one owner in charge
            </div>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink lg:text-5xl">
              Run your company with a crew that never clocks out.
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted lg:text-lg">
              Type what you need done. The Manager Agent breaks it down and hands work to
              Operations, Finance, Customer, and Marketing — you just approve what matters.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-ink shadow-panel hover:brightness-95"
              >
                Start your company OS
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium text-ink hover:bg-raised"
              >
                I already have an account
              </Link>
            </div>
          </div>

          {/* Signature: mock command console */}
          <div className="console-grid rounded-2xl border border-border bg-surface p-1 shadow-panel">
            <div className="rounded-xl bg-raised/60 p-5">
              <div className="mb-4 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-2 font-mono text-xs text-muted">command console</span>
              </div>
              <div className="rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-ink">
                <span className="text-accent">$</span> Ship 3 kurtas to Priya and log the sale
                <span className="caret-blink ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-ink" />
              </div>
              <div className="mt-4 space-y-2 font-mono text-xs">
                <FeedLine dot="manager" text="Manager: decomposed into 3 tasks — delegating." />
                <FeedLine dot="operations" text="Operations: checked inventory, processed order." />
                <FeedLine dot="finance" text="Finance: recorded ₹2,700 revenue." />
                <FeedLine dot="customer" text="Customer: confirmation drafted for Priya." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agents */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Your five agents</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Each one has one job and no ego about it. The Manager Agent is the only one that talks to you directly.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {AGENTS.map((a) => (
            <div key={a.name} className="rounded-xl border border-border bg-surface p-5 shadow-panel">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${a.bg}`}>
                <Bot className={`h-4 w-4 ${a.colorVar}`} />
              </div>
              <p className="font-display text-sm font-semibold text-ink">{a.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 rounded-2xl border border-border bg-surface p-8 shadow-panel sm:grid-cols-3">
          <Feature icon={Activity} title="Live activity feed" desc="Watch every agent turn stream in over WebSocket, in real time." />
          <Feature icon={ShieldCheck} title="Human approval gate" desc="Anything with a cost attached waits for your yes or no." />
          <Feature icon={Wallet} title="Real books" desc="Every sale and expense lands in one ledger you can actually read." />
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted">
        One-Person Company OS — built for a company of one.
      </footer>
    </div>
  );
}

function FeedLine({ dot, text }: { dot: string; text: string }) {
  const dotClass: Record<string, string> = {
    manager: 'bg-manager',
    operations: 'bg-operations',
    finance: 'bg-finance',
    customer: 'bg-customer',
  };
  return (
    <div className="flex items-start gap-2 text-muted">
      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass[dot]}`} />
      <span>{text}</span>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: typeof Activity; title: string; desc: string }) {
  return (
    <div>
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 font-display text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{desc}</p>
    </div>
  );
}
