import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api, setAuthToken } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface InviteInfo {
  status: 'needs_registration';
  email: string;
  orgName: string;
  inviteToken: string;
}

type PageState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'register'; info: InviteInfo }
  | { phase: 'joined' };

export default function Register() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const [state, setState] = useState<PageState>({ phase: 'loading' });
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inviteParam = params.get('invite');

  useEffect(() => {
    if (!inviteParam) {
      setState({ phase: 'error', message: 'No invitation token found in the link.' });
      return;
    }

    api
      .post<{ status: 'joined'; accessToken: string } | InviteInfo>('/auth/accept-invitation', {
        token: inviteParam,
      })
      .then(async (res) => {
        const data = res.data;
        if (data.status === 'joined') {
          // Existing verified user → set tokens and redirect
          setAuthToken(data.accessToken);
          const me = await api.get('/auth/me');
          if (me.data?.email) {
            setUser({
              id: String(me.data.sub ?? crypto.randomUUID()),
              email: String(me.data.email),
              fullName: String(me.data.fullName ?? me.data.email),
              role: me.data.role ?? 'member',
              orgId: me.data.orgId ? String(me.data.orgId) : '',
              onboardingCompletedAt: me.data.onboardingCompletedAt ?? null,
            });
          }
          setState({ phase: 'joined' });
          toast.success('Welcome! You have joined the organization.');
          void navigate('/dashboard');
        } else {
          setState({ phase: 'register', info: data });
        }
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setState({
          phase: 'error',
          message: err.response?.data?.message ?? 'Invalid or expired invitation link.',
        });
      });
  }, [inviteParam, navigate, setUser]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (state.phase !== 'register') return;
    setSubmitting(true);
    try {
      await api.post('/auth/signup-with-invitation', {
        inviteToken: state.info.inviteToken,
        fullName: fullName.trim(),
        password,
      });
      toast.success('Account created! Please check your email to verify your account.');
      void navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (state.phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-300 border-t-violet-600" />
          <p className="text-sm text-slate-500">Validating invitation…</p>
        </div>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-1 text-lg font-semibold text-red-700">Invitation Invalid</p>
          <p className="mb-6 text-sm text-slate-500">{state.message}</p>
          <button
            onClick={() => void navigate('/')}
            className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === 'joined') {
    return null; // Redirecting
  }

  const { info } = state;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 shadow-lg">
            <span className="text-2xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">You're invited!</h1>
          <p className="mt-1 text-sm text-slate-500">
            Join <span className="font-semibold text-violet-700">{info.orgName}</span> on Good Job
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Pre-filled email (read-only) */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-slate-600">Email</label>
            <input
              type="email"
              value={info.email}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
            />
          </div>

          <form onSubmit={(e) => void handleRegister(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !fullName.trim() || password.length < 8}
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Creating account…' : 'Create Account & Join Team'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <button
              onClick={() => void navigate('/')}
              className="font-medium text-violet-600 hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
