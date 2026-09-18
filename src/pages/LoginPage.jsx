import { LockKeyhole, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { auth, googleProvider } from '../config/firebase.js';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  async function handleGoogleSignIn() {
    setError('');

    if (!auth || !googleProvider) {
      setError('Google Sign-In is unavailable right now.');
      return;
    }

    setIsGoogleLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (firebaseError) {
      const code = firebaseError?.code;

      if (code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else if (code === 'auth/popup-blocked') {
        setError('Google sign-in popup was blocked. Please allow popups and try again.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError('This account already exists with a different sign-in method.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-mist to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8 transition-colors">
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <Card className="w-full max-w-md p-6 shadow-soft dark:bg-slate-900 dark:border-slate-700">
        <div className="mb-6 rounded-lg bg-gradient-to-br from-emerald-700 to-cyan-700 dark:from-emerald-600 dark:to-cyan-600 p-5 text-white">
          <LockKeyhole size={28} aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold">Chanda BC Manager</h1>
          <p className="mt-2 text-sm text-white/80">Private access for Santoshi Chanda and Ravi Balate.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Email" error={errors.email}>
            <input
              type="email"
              className="min-h-11 w-full rounded-md border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 outline-none focus:border-leaf dark:focus:border-emerald-500"
              autoComplete="email"
              {...register('email', { required: 'Email is required' })}
            />
          </FormField>

          <FormField label="Password" error={errors.password}>
            <input
              type="password"
              className="min-h-11 w-full rounded-md border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 outline-none focus:border-leaf dark:focus:border-emerald-500"
              autoComplete="current-password"
              {...register('password', { required: 'Password is required' })}
            />
          </FormField>

          {error && (
            <p className="rounded-md bg-rose-50 dark:bg-red-950 px-3 py-2 text-sm font-medium text-clay dark:text-red-300">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || isGoogleLoading}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isGoogleLoading ? 'Signing in with Google...' : 'Sign in with Google'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </Card>
    </main>
  );
}
