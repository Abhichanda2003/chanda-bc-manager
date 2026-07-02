import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(values) {
    setError('');
    try {
      await login(values.email, values.password);
    } catch {
      setError('Invalid email or password');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-mist to-amber-50 px-4 py-8">
      <Card className="w-full max-w-md p-6 shadow-soft">
        <div className="mb-6 rounded-lg bg-gradient-to-br from-emerald-700 to-cyan-700 p-5 text-white">
          <LockKeyhole size={28} aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold">Chanda BC Manager</h1>
          <p className="mt-2 text-sm text-white/80">Private access for Santoshi Chanda and Ravi Balate.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Email" error={errors.email}>
            <input
              type="email"
              className="min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-leaf"
              autoComplete="email"
              {...register('email', { required: 'Email is required' })}
            />
          </FormField>
          <FormField label="Password" error={errors.password}>
            <input
              type="password"
              className="min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-leaf"
              autoComplete="current-password"
              {...register('password', { required: 'Password is required' })}
            />
          </FormField>
          {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-clay">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
