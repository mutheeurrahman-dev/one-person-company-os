import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

// ---------- Button ----------
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
  const sizes = { sm: 'text-sm px-3 py-1.5', md: 'text-sm px-4 py-2.5' };
  const variants = {
    primary: 'bg-accent text-accent-ink hover:brightness-95 shadow-panel',
    secondary: 'bg-surface border border-border text-ink hover:bg-raised',
    ghost: 'text-muted hover:text-ink hover:bg-raised',
    danger: 'bg-danger text-white hover:brightness-95',
  };
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ---------- Input ----------
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          'rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted outline-none transition-colors',
          'focus:border-accent focus:ring-1 focus:ring-accent',
          error ? 'border-danger' : 'border-border',
          className
        )}
        {...rest}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

// ---------- Textarea ----------
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...rest }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={clsx(
          'rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted outline-none transition-colors',
          'focus:border-accent focus:ring-1 focus:ring-accent',
          error ? 'border-danger' : 'border-border',
          className
        )}
        {...rest}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

// ---------- Select ----------
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, id, children, ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          'rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors',
          'focus:border-accent focus:ring-1 focus:ring-accent',
          className
        )}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

// ---------- Card ----------
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx('rounded-xl border border-border bg-surface shadow-panel', className)}>{children}</div>
  );
}

// ---------- Badge ----------
type BadgeTone = 'neutral' | 'success' | 'danger' | 'info' | 'accent';

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-raised text-muted border-border',
    success: 'bg-success/10 text-success border-success/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-info/10 text-info border-info/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
  };
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}

export function statusTone(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (['completed', 'success', 'approved', 'active'].includes(s)) return 'success';
  if (['failed', 'rejected', 'error'].includes(s)) return 'danger';
  if (['pending', 'waiting_approval', 'retrying', 'started'].includes(s)) return 'accent';
  if (['running'].includes(s)) return 'info';
  return 'neutral';
}

// ---------- Spinner / Loading ----------
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('h-5 w-5 animate-spin text-muted', className)} />;
}

export function PageLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="h-6 w-6" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ---------- Empty State ----------
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-raised/40 px-6 py-16 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <div>
        <p className="font-display text-base font-medium text-ink">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------- Skeleton ----------
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-md bg-raised', className)} />;
}

// ---------- Error banner ----------
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{message}</div>
  );
}
