import { useEffect, useState } from 'react';
import { Lightbulb, RefreshCw, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { insightsApi } from '../lib/endpoints';
import { Badge, Button, Card, EmptyState, ErrorBanner, Skeleton } from '../components/ui';
import { apiErrorMessage } from '../lib/api';
import type { InsightResponse } from '../types';

const SEVERITY_ICON: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const SEVERITY_TONE: Record<string, 'info' | 'accent' | 'danger'> = {
  info: 'info',
  warning: 'accent',
  critical: 'danger',
};

export default function Insights() {
  const [insights, setInsights] = useState<InsightResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function load() {
    insightsApi
      .list()
      .then(setInsights)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load insights.')));
  }

  useEffect(load, []);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await insightsApi.refresh();
      setInsights(res);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not refresh insights.'));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Business Insights</h1>
          <p className="mt-1 text-sm text-muted">
            The Manager Agent reviews your business after every workflow and flags what needs attention.
          </p>
        </div>
        <Button onClick={refresh} loading={refreshing} size="sm" variant="secondary">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}

      {insights === null ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="h-8 w-8" />}
          title="No insights yet"
          description="Run a few workflows, then refresh — insights surface things like unusual spending or low stock."
          action={
            <Button onClick={refresh} loading={refreshing} size="sm">
              <RefreshCw className="h-4 w-4" /> Check now
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {insights.map((insight) => {
            const Icon = SEVERITY_ICON[insight.severity] ?? Info;
            return (
              <Card key={insight.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 text-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm font-semibold text-ink">{insight.title}</p>
                      <Badge tone={SEVERITY_TONE[insight.severity] ?? 'neutral'}>{insight.severity}</Badge>
                      <Badge tone="neutral">{insight.category}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted">{insight.detail}</p>
                    <p className="mt-2 text-[11px] text-muted">{new Date(insight.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
