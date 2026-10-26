export type AgentKey = 'manager_agent' | 'finance_agent' | 'operations_agent' | 'customer_agent' | 'marketing_agent';

interface AgentMeta {
  label: string;
  colorVar: string; // tailwind color token name (manager|finance|operations|customer|marketing)
}

export const AGENT_META: Record<string, AgentMeta> = {
  manager_agent: { label: 'Manager', colorVar: 'manager' },
  finance_agent: { label: 'Finance', colorVar: 'finance' },
  operations_agent: { label: 'Operations', colorVar: 'operations' },
  customer_agent: { label: 'Customer', colorVar: 'customer' },
  marketing_agent: { label: 'Marketing', colorVar: 'marketing' },
};

export function agentLabel(agent: string | null | undefined): string {
  if (!agent) return 'Unknown';
  return AGENT_META[agent]?.label ?? agent.replace(/_agent$/, '').replace(/^\w/, (c) => c.toUpperCase());
}

export function agentColorClass(agent: string): string {
  const meta = AGENT_META[agent];
  return meta ? meta.colorVar : 'muted';
}

export const ALL_AGENTS: AgentKey[] = [
  'manager_agent',
  'operations_agent',
  'finance_agent',
  'customer_agent',
  'marketing_agent',
];
