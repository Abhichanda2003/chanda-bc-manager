import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import Card from './Card.jsx';
import Button from './Button.jsx';
import FormField from './FormField.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(
        'Password reset link has been sent to your email. Please check your inbox.'
      );
      setEmail('');

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);

      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many reset requests. Please try again later.');
      } else {
        setError('Failed to send reset link. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-mist to-amber-50 px-4 py-8">
      <Card className="w-full max-w-md p-6 shadow-soft">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Forgot Password?</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Email" error={error ? { message: error } : null}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading || !!successMessage}
              className="min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-leaf disabled:bg-slate-100"
              autoComplete="email"
            />
          </FormField>

          {successMessage && (
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !!successMessage}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
              disabled={isLoading}
            >
              Back to Login
            </button>
          </div>
        </form>
      </Card>
    </main>
  );
}
