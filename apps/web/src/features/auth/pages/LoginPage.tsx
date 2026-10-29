import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { loginSchema } from '@dsa/shared';
import { Button } from '../../../components/ui/Button';
import { login } from '../api';
import { TextField } from '../components/AuthFormFields';
import { useAuthStore } from '../store';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'email' || key === 'password') {
          next[key] = issue.message;
        }
      }
      setFieldErrors(next);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const user = await login(parsed.data);
      setUser(user);
      const from = searchParams.get('from');
      navigate(from && from.startsWith('/') ? from : '/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof AxiosError) {
        const message =
          (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message ??
          'Unable to sign in. Check your details and try again.';
        setFormError(message);
      } else {
        setFormError('Unable to sign in. Check your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Sign in</h1>
      <p className="mt-2 text-sm text-muted">Continue your DSA practice where you left off.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          required
        />

        {formError ? (
          <p
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-muted">
        New here?{' '}
        <Link to="/register" className="font-medium">
          Create an account
        </Link>
      </p>
    </section>
  );
}
