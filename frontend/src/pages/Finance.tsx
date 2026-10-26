import { useEffect, useState, type FormEvent } from 'react';
import { Plus, X, Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { financeApi } from '../lib/endpoints';
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Select, Skeleton, Textarea } from '../components/ui';
import { apiErrorMessage } from '../lib/api';
import type { FinanceSummaryResponse, TransactionResponse } from '../types';

interface FormState {
  type: 'revenue' | 'expense';
  amount: string;
  category: string;
  description: string;
}

const initialForm: FormState = { type: 'expense', amount: '', category: 'general', description: '' };

export default function Finance() {
  const [summary, setSummary] = useState<FinanceSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    Promise.all([financeApi.summary(), financeApi.listTransactions()])
      .then(([s, t]) => {
        setSummary(s);
        setTransactions(t);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load finance data.')));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setAmountError(null);
    setFormError(null);
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      setAmountError('Enter an amount greater than 0.');
      return;
    }
    setSubmitting(true);
    try {
      await financeApi.createTransaction({
        type: form.type,
        amount,
        category: form.category || 'general',
        description: form.description || null,
      });
      setForm(initialForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not record that transaction.'));
    } finally {
      setSubmitting(false);
    }
  }

  const chartData = buildChartData(transactions);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Finance</h1>
          <p className="mt-1 text-sm text-muted">The Finance Agent keeps this ledger up to date automatically.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} size="sm">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add transaction'}
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
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'revenue' | 'expense' }))}
            >
              <option value="expense">Expense</option>
              <option value="revenue">Revenue</option>
            </Select>
            <Input
              label="Amount (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              error={amountError ?? undefined}
              placeholder="1200"
            />
            <Input
              label="Category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="supplies"
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What was this for?"
                rows={2}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={submitting}>
                Save transaction
              </Button>
            </div>
          </form>
        </Card>
      )}

      {summary === null ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryTile icon={TrendingUp} label="Total revenue" value={formatCurrency(summary.total_revenue)} iconClass="text-finance" wrapClass="bg-finance/10" />
          <SummaryTile icon={TrendingDown} label="Total expenses" value={formatCurrency(summary.total_expenses)} iconClass="text-danger" wrapClass="bg-danger/10" />
          <SummaryTile icon={Wallet} label="Profit" value={formatCurrency(summary.profit)} iconClass="text-accent" wrapClass="bg-accent/10" />
          <SummaryTile icon={Wallet} label="Today's revenue" value={formatCurrency(summary.today_revenue)} iconClass="text-info" wrapClass="bg-info/10" />
        </div>
      )}

      {chartData.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink">Revenue vs. expenses (recent)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis dataKey="label" stroke="rgb(var(--muted))" fontSize={12} />
                <YAxis stroke="rgb(var(--muted))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="rgb(var(--finance))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="rgb(var(--danger))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {transactions === null ? (
        <Card className="p-5">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      ) : transactions.length === 0 ? (
        <EmptyState icon={<Wallet className="h-8 w-8" />} title="No transactions yet" description="Sales and expenses will appear here as your agents record them." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-raised/40">
                  <td className="px-5 py-3">
                    <Badge tone={t.type === 'revenue' ? 'success' : 'neutral'}>{t.type}</Badge>
                  </td>
                  <td className={`px-5 py-3 font-medium ${t.type === 'revenue' ? 'text-finance' : 'text-ink'}`}>
                    {t.type === 'revenue' ? '+' : '−'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-5 py-3 text-muted">{t.category}</td>
                  <td className="px-5 py-3 text-muted">
                    <div className="flex items-center gap-1.5">
                      {t.description || '—'}
                      {t.is_flagged_unusual && (
                        <Badge tone="danger">
                          <AlertTriangle className="h-3 w-3" /> unusual
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  iconClass,
  wrapClass,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  iconClass: string;
  wrapClass: string;
}) {
  return (
    <Card className="p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${wrapClass}`}>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>
      <p className="font-display text-lg font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </Card>
  );
}

function buildChartData(transactions: TransactionResponse[] | null) {
  if (!transactions || transactions.length === 0) return [];
  const byDay = new Map<string, { revenue: number; expense: number }>();
  for (const t of [...transactions].reverse()) {
    const day = new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const entry = byDay.get(day) ?? { revenue: 0, expense: 0 };
    if (t.type === 'revenue') entry.revenue += t.amount;
    else entry.expense += t.amount;
    byDay.set(day, entry);
  }
  return Array.from(byDay.entries())
    .slice(-14)
    .map(([label, v]) => ({ label, ...v }));
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
