import { useEffect, useState, type FormEvent } from 'react';
import { Users, Plus, X, Star, AlertTriangle } from 'lucide-react';
import { customersApi } from '../lib/endpoints';
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Skeleton } from '../components/ui';
import { apiErrorMessage } from '../lib/api';
import type { CustomerResponse } from '../types';

interface FormState {
  name: string;
  email: string;
  phone: string;
  is_vip: boolean;
}

const initialForm: FormState = { name: '', email: '', phone: '', is_vip: false };

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    customersApi
      .list()
      .then(setCustomers)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load customers.')));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setNameError(null);
    if (!form.name.trim()) {
      setNameError('Customer name is required.');
      return;
    }
    setSubmitting(true);
    try {
      await customersApi.create({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        is_vip: form.is_vip,
      });
      setForm(initialForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not create that customer.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Customers</h1>
          <p className="mt-1 text-sm text-muted">
            The Customer Agent creates these automatically, or add one yourself.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} size="sm">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add customer'}
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}

      {showForm && (
        <Card className="p-5">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            {formError && (
              <div className="sm:col-span-2">
                <ErrorBanner message={formError} />
              </div>
            )}
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={nameError ?? undefined}
              placeholder="Ananya Rao"
            />
            <Input
              label="Email (optional)"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="ananya@example.com"
            />
            <Input
              label="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210"
            />
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.is_vip}
                onChange={(e) => setForm((f) => ({ ...f, is_vip: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              Mark as VIP
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" loading={submitting}>
                Save customer
              </Button>
            </div>
          </form>
        </Card>
      )}

      {customers === null ? (
        <CustomersSkeleton />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No customers yet"
          description="Add your first customer, or let the Customer Agent create one from an order."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-customer/15 text-sm font-semibold text-customer">
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="flex gap-1.5">
                  {c.is_vip && (
                    <Badge tone="accent">
                      <Star className="h-3 w-3" /> VIP
                    </Badge>
                  )}
                  {c.has_unresolved_issue && (
                    <Badge tone="danger">
                      <AlertTriangle className="h-3 w-3" /> Issue
                    </Badge>
                  )}
                </div>
              </div>
              <p className="mt-3 font-display text-sm font-semibold text-ink">{c.name}</p>
              {c.email && <p className="mt-0.5 text-xs text-muted">{c.email}</p>}
              {c.phone && <p className="text-xs text-muted">{c.phone}</p>}
              <p className="mt-3 text-[11px] text-muted">Joined {new Date(c.created_at).toLocaleDateString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomersSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="mt-3 h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </Card>
      ))}
    </div>
  );
}
