import clsx from 'clsx';

const DOT_CLASS: Record<string, string> = {
  manager: 'bg-manager',
  operations: 'bg-operations',
  finance: 'bg-finance',
  customer: 'bg-customer',
  marketing: 'bg-marketing',
  muted: 'bg-muted',
};

export function AgentDot({ colorVar, active = false, size = 'sm' }: { colorVar: string; active?: boolean; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  return (
    <span className={clsx('inline-block rounded-full', dim, DOT_CLASS[colorVar] ?? DOT_CLASS.muted, active && 'pulse')} />
  );
}
