import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, ErrorBanner, Input } from '../components/ui';
import { apiErrorMessage } from '../lib/api';
import { AuthShell } from '../components/AuthShell';

interface FormState {
  full_name: string;
  business_name: string;
  industry: string;
  email: string;
  password: string;
  confirm: string;
}

const initialForm: FormState = {
  full_name: '',
  business_name: '',
  industry: '',
  email: '',
  password: '',
  confirm: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.full_name.trim()) errs.full_name = 'Required';
    if (!form.business_name.trim()) errs.business_name = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 6) errs.password = 'At least 6 characters';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        business_name: form.business_name,
        industry: form.industry || 'General',
      });
      navigate('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Set up your company" subtitle="One owner, five agents, zero payroll.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Input
          id="full_name"
          label="Your name"
          value={form.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          error={fieldErrors.full_name}
          placeholder="Jordan Lee"
        />
        <Input
          id="business_name"
          label="Business name"
          value={form.business_name}
          onChange={(e) => update('business_name', e.target.value)}
          error={fieldErrors.business_name}
          placeholder="Threads Co."
        />
        <Input
          id="industry"
          label="Industry (optional)"
          value={form.industry}
          onChange={(e) => update('industry', e.target.value)}
          placeholder="Apparel"
        />
        <Input
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          error={fieldErrors.email}
          placeholder="you@company.com"
        />
        <Input
          id="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          error={fieldErrors.password}
          placeholder="At least 6 characters"
        />
        <Input
          id="confirm"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => update('confirm', e.target.value)}
          error={fieldErrors.confirm}
          placeholder="Repeat password"
        />
        <Button type="submit" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already set up?{' '}
        <Link to="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
