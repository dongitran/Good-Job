import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
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
          onboardingCompletedAt: me.data?.onboardingCompletedAt ?? null,
        });

        setState('success');
        setMessage('Email verified! Continue to set up your workspace.');
      } catch (error) {
        setState('error');
        setMessage(extractErrorMessage(error));
      }
    };

    void verify();
  }, [navigate, setUser, token]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090f2b] px-4 py-8 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.24),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(139,92,246,0.2),transparent_40%),linear-gradient(120deg,#090f2b,#111a3d)]" />

      <div className="relative w-full max-w-[430px] overflow-hidden rounded-[24px] border border-white/20 bg-white/95 text-slate-800 shadow-[0_28px_90px_rgba(9,15,43,0.55)]">
        <div className="bg-gradient-to-r from-violet-600 to-blue-500 px-6 py-8 text-white">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]">
            <ShieldCheck className="h-4 w-4" />
            Good Job
          </div>
          <h1 className="mt-4 text-center text-3xl font-black">Verify Email</h1>
          <p className="mt-2 text-center text-sm text-violet-100">
            One last step to secure your account
          </p>
        </div>

        <div className="px-6 py-7">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center gap-3">
              {state === 'verifying' ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : null}
              {state === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : null}
              {state === 'error' ? <AlertCircle className="h-5 w-5 text-rose-500" /> : null}
              <p className="text-sm font-semibold text-slate-800">
                {state === 'verifying' ? 'Verifying your account...' : null}
                {state === 'success' ? 'Verification complete' : null}
                {state === 'error' ? 'Verification failed' : null}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{message}</p>
          </div>

          {state === 'error' ? (
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:brightness-105"
            >
              Back to Sign In
            </button>
          ) : null}
          {state === 'success' ? (
            <button
              type="button"
              onClick={() => navigate('/onboarding', { replace: true })}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:brightness-105"
            >
              Continue to Setup →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
