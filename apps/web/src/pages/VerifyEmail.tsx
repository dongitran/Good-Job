import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { api, setAuthToken } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

type VerifyState = 'verifying' | 'success' | 'error';

function roleFromUnknown(input: unknown): 'member' | 'admin' | 'owner' {
  if (input === 'owner' || input === 'admin' || input === 'member') {
    return input;
  }
  return 'member';
}

function nameFromEmail(email: string): string {
  const [local = 'User'] = email.split('@');
  return local
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

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
  return 'Email verification failed. Please request a new verification email.';
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const setUser = useAuthStore((state) => state.setUser);
  const [state, setState] = useState<VerifyState>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setState('error');
        setMessage('Missing verification token.');
        return;
      }

      try {
        const { data } = await api.post('/auth/verify-email', { token });
        if (!data?.accessToken) {
          throw new Error('Missing access token');
        }

        setAuthToken(String(data.accessToken));

        const me = await api.get('/auth/me');
        const email = String(me.data?.email ?? '');
        if (!email) {
          throw new Error('Missing email in auth payload.');
        }

        setUser({
          id: String(me.data?.sub ?? crypto.randomUUID()),
          email,
          fullName: String(me.data?.fullName ?? nameFromEmail(email)),
          role: roleFromUnknown(me.data?.role),
          orgId: me.data?.orgId ? String(me.data.orgId) : '',
          avatarUrl: me.data?.avatarUrl ? String(me.data.avatarUrl) : undefined,
        });

        setState('success');
        setMessage('Email verified. Redirecting...');
        setTimeout(() => navigate('/', { replace: true }), 1000);
      } catch (error) {
        setState('error');
        setMessage(extractErrorMessage(error));
      }
    };

    void verify();
  }, [navigate, setUser, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-700">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Verify Email</h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        {state === 'error' ? (
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Sign In
          </button>
        ) : null}
      </div>
    </div>
  );
}
