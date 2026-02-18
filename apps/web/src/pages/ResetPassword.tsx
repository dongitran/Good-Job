import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { api } from '@/lib/api';

type Status = 'idle' | 'submitting' | 'success' | 'error';

function extractErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
      'string'
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message as string;
  }
  return 'Failed to reset password.';
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      setStatus('error');
      setMessage('Missing reset token.');
      return;
    }

    if (password.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('submitting');
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      setStatus('success');
      setMessage('Password reset successful. Redirecting to sign in...');
      setTimeout(() => navigate('/', { replace: true }), 1200);
    } catch (error) {
      setStatus('error');
      setMessage(extractErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-700">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="mt-2 text-sm text-slate-600">Choose a new password for your account.</p>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">New Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">
              Confirm Password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
            />
          </label>

          {message ? (
            <p className={`text-sm ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-70"
          >
            {status === 'submitting' ? 'Saving...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
