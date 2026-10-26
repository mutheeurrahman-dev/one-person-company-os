import { useEffect, useState, type FormEvent } from 'react';
import { Package, Plus, X, Minus, AlertTriangle } from 'lucide-react';
import { inventoryApi } from '../lib/endpoints';
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Skeleton } from '../components/ui';
import { apiErrorMessage } from '../lib/api';
import type { ProductResponse } from '../types';

interface FormState {
  name: string;
  sku: string;
  price: string;
  cost: string;
  initial_quantity: string;
  low_stock_threshold: string;
}

const initialForm: FormState = {
  name: '',
  sku: '',
  price: '',
  cost: '',
  initial_quantity: '0',
  low_stock_threshold: '5',
};

export default function Inventory() {
  const [products, setProducts] = useState<ProductResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  function load() {
    inventoryApi
      .listProducts()
      .then(setProducts)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load inventory.')));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setNameError(null);
    setFormError(null);
    if (!form.name.trim()) {
      setNameError('Product name is required.');
      return;
    }
    setSubmitting(true);
    try {
      await inventoryApi.createProduct({
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        price: parseFloat(form.price) || 0,
        cost: parseFloat(form.cost) || 0,
        initial_quantity: parseInt(form.initial_quantity, 10) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 5,
      });
      setForm(initialForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not create that product.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function adjust(productId: string, delta: number) {
    setAdjustingId(productId);
    try {
      await inventoryApi.adjust(productId, { quantity_delta: delta });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not adjust stock.'));
    } finally {
      setAdjustingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Inventory</h1>
          <p className="mt-1 text-sm text-muted">Stock the Operations Agent checks before confirming a sale.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} size="sm">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add product'}
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}

      {showForm && (
        <Card className="p-5">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {formError && (
              <div className="sm:col-span-2 lg:col-span-3">
                <ErrorBanner message={formError} />
              </div>
            )}
            <Input
              label="Product name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={nameError ?? undefined}
              placeholder="Kurta"
            />
            <Input
              label="SKU (optional)"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              placeholder="KURTA-02"
            />
            <Input
              label="Price (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="900"
            />
            <Input
              label="Cost (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              placeholder="400"
            />
            <Input
              label="Initial quantity"
              type="number"
              min="0"
              value={form.initial_quantity}
              onChange={(e) => setForm((f) => ({ ...f, initial_quantity: e.target.value }))}
            />
            <Input
              label="Low stock threshold"
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))}
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" loading={submitting}>
                Save product
              </Button>
            </div>
          </form>
        </Card>
      )}

      {products === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No products yet"
          description="Add your first product to start tracking stock."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-semibold text-ink">{p.name}</p>
                  {p.sku && <p className="text-xs text-muted">SKU: {p.sku}</p>}
                </div>
                {p.is_low_stock && (
                  <Badge tone="danger">
                    <AlertTriangle className="h-3 w-3" /> Low stock
                  </Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                <div>
                  Price: <span className="font-medium text-ink">₹{p.price}</span>
                </div>
                <div>
                  Cost: <span className="font-medium text-ink">₹{p.cost}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-raised/50 px-3 py-2">
                <div>
                  <p className="text-xs text-muted">In stock</p>
                  <p className="font-display text-lg font-semibold text-ink">{p.quantity}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => adjust(p.id, -1)}
                    disabled={adjustingId === p.id || p.quantity === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-ink transition-colors hover:bg-raised disabled:opacity-40"
                    aria-label={`Decrease ${p.name} stock`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => adjust(p.id, 1)}
                    disabled={adjustingId === p.id}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-ink transition-colors hover:bg-raised disabled:opacity-40"
                    aria-label={`Increase ${p.name} stock`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">Alerts below {p.low_stock_threshold} units</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
