import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { ordersApi } from '../lib/endpoints';
import { Badge, Card, EmptyState, ErrorBanner, Skeleton, statusTone } from '../components/ui';
import { apiErrorMessage } from '../lib/api';
import type { OrderResponse } from '../types';

export default function Orders() {
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ordersApi
      .list()
      .then(setOrders)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load orders.')));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Orders</h1>
        <p className="mt-1 text-sm text-muted">
          Orders are created automatically when the Operations Agent processes a sale.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {orders === null ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="No orders yet"
          description='Try a command like "Sell 2 Shirts to Priya Sharma" from the Dashboard.'
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-raised/40">
                  <td className="px-5 py-3 font-mono text-xs text-muted">{o.id.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-ink">{o.quantity}</td>
                  <td className="px-5 py-3 font-medium text-ink">{formatCurrency(o.total_amount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted">{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <Card className="p-5">
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </Card>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
