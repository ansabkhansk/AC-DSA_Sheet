import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { registerSchema } from '@dsa/shared';
import { Button } from '../../../components/ui/Button';
import { register } from '../api';
import { TextField } from '../components/AuthFormFields';
import { useAuthStore } from '../store';

type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'name' || key === 'email' || key === 'password') {
          next[key] = issue.message;
        }
      }
      setFieldErrors(next);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const user = await register(parsed.data);
      setUser(user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof AxiosError) {
        const message =
          (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message ??
          'Unable to create your account. Please try again.';
        setFormError(message);
      } else {
        setFormError('Unable to create your account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Create account</h1>
      <p className="mt-2 text-sm text-muted">
        Track progress across chapters, topics, and problems.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <TextField
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
          required
        />
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
          autoComplete="new-password"
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
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium">
          Sign in
        </Link>
      </p>
    </section>
  );
}
