import { useEffect, useState } from 'react';
import { ShieldCheck, Check, X } from 'lucide-react';
import { approvalsApi } from '../lib/endpoints';
import { Badge, Button, Card, EmptyState, ErrorBanner, Select, Skeleton, statusTone } from '../components/ui';
import { apiErrorMessage } from '../lib/api';
import type { ApprovalResponse } from '../types';

type FilterValue = 'pending' | 'approved' | 'rejected' | 'all';

export default function Approvals() {
  const [approvals, setApprovals] = useState<ApprovalResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('pending');
  const [decidingId, setDecidingId] = useState<string | null>(null);

  function load(f: FilterValue) {
    setApprovals(null);
    approvalsApi
      .list(f === 'all' ? undefined : f)
      .then(setApprovals)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load approvals.')));
  }

  useEffect(() => load(filter), [filter]);

  async function decide(id: string, approve: boolean) {
    setDecidingId(id);
    setError(null);
    try {
      await approvalsApi.decide(id, approve);
      load(filter);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not record that decision.'));
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Approvals</h1>
          <p className="mt-1 text-sm text-muted">Anything with a cost attached waits here for your decision.</p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as FilterValue)} className="w-40">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </Select>
      </div>

      {error && <ErrorBanner message={error} />}

      {approvals === null ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-8 w-8" />}
          title={filter === 'pending' ? 'Nothing waiting on you' : 'Nothing here'}
          description={
            filter === 'pending'
              ? 'When an agent proposes a costed action, like a marketing campaign, it will show up here.'
              : 'No approvals match this filter yet.'
          }
        />
      ) : (
        <div className="space-y-4">
          {approvals.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-sm font-semibold text-ink">{a.action_title}</p>
                    <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Requested by {a.requesting_agent.replace(/_agent$/, '').replace(/^\w/, (c) => c.toUpperCase())} ·{' '}
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                  {a.description && <p className="mt-3 text-sm text-ink">{a.description}</p>}
                  {a.reason && <p className="mt-2 text-xs text-muted">Reason: {a.reason}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Estimated cost</p>
                  <p className="font-display text-lg font-semibold text-ink">{formatCurrency(a.estimated_cost)}</p>
                </div>
              </div>

              {a.status === 'pending' && (
                <div className="mt-4 flex gap-2 border-t border-border pt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => decide(a.id, true)}
                    loading={decidingId === a.id}
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => decide(a.id, false)}
                    loading={decidingId === a.id}
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
