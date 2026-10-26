import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Workflow as WorkflowIcon } from 'lucide-react';
import { agentsApi } from '../lib/endpoints';
import { Badge, Card, EmptyState, ErrorBanner, PageLoading, Skeleton, statusTone } from '../components/ui';
import { AgentDot } from '../components/AgentDot';
import { AGENT_META, agentLabel } from '../lib/agents';
import { apiErrorMessage } from '../lib/api';
import type { WorkflowResponse } from '../types';

export default function AgentActivity() {
  const [workflows, setWorkflows] = useState<WorkflowResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    agentsApi
      .listWorkflows()
      .then(setWorkflows)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load workflows.')));
  }, []);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (error) return <ErrorBanner message={error} />;
  if (workflows === null) return <PageLoading label="Loading workflow history…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Agent Activity</h1>
        <p className="mt-1 text-sm text-muted">Every workflow the Manager Agent has run, oldest task first.</p>
      </div>

      {workflows.length === 0 ? (
        <EmptyState
          icon={<WorkflowIcon className="h-8 w-8" />}
          title="No workflows yet"
          description="Submit a command from the Dashboard's AI Command Box to see your agents get to work."
        />
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => {
            const isOpen = expanded.has(wf.id);
            return (
              <Card key={wf.id} className="overflow-hidden">
                <button
                  onClick={() => toggle(wf.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-raised/50"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{wf.user_request}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(wf.created_at).toLocaleString()} · {wf.tasks.length} task
                      {wf.tasks.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Badge tone={statusTone(wf.status)}>{wf.status.replace(/_/g, ' ')}</Badge>
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-raised/30 px-5 py-4">
                    {wf.result_summary && (
                      <p className="mb-3 text-sm text-ink">{wf.result_summary}</p>
                    )}
                    {wf.tasks.length === 0 ? (
                      <p className="text-sm text-muted">No tasks were recorded for this workflow.</p>
                    ) : (
                      <ol className="space-y-3">
                        {wf.tasks.map((task) => (
                          <li key={task.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
                            <AgentDot colorVar={AGENT_META[task.assigned_agent]?.colorVar ?? 'muted'} size="md" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-ink">{agentLabel(task.assigned_agent)}</span>
                                <span className="text-xs text-muted">→ {task.action.replace(/_/g, ' ')}</span>
                                <Badge tone={statusTone(task.status)}>{task.status.replace(/_/g, ' ')}</Badge>
                                {task.retry_count > 0 && (
                                  <span className="text-xs text-muted">retried {task.retry_count}×</span>
                                )}
                              </div>
                              {task.error && <p className="mt-1 text-xs text-danger">{task.error}</p>}
                              {task.result && (
                                <pre className="mt-2 overflow-x-auto rounded-md bg-raised px-3 py-2 font-mono text-[11px] text-muted">
                                  {JSON.stringify(task.result, null, 2)}
                                </pre>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Loading skeleton kept for potential future streaming-in of workflows.
export function WorkflowSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
