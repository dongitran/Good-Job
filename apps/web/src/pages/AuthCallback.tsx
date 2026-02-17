import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

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

export default function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const finalizeGoogleLogin = async () => {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');

      if (!accessToken) {
        navigate('/', { replace: true });
        return;
      }

      localStorage.setItem('access_token', accessToken);

      try {
        const { data } = await api.get('/auth/me');
        const email = String(data?.email ?? '');
        if (!email) {
          throw new Error('Missing email in auth payload.');
        }

        setUser({
          id: String(data?.sub ?? crypto.randomUUID()),
          email,
          fullName: String(data?.fullName ?? nameFromEmail(email)),
          role: roleFromUnknown(data?.role),
          orgId: data?.orgId ? String(data.orgId) : '',
        });
      } catch {
        localStorage.removeItem('access_token');
      } finally {
        window.history.replaceState({}, document.title, '/');
        navigate('/', { replace: true });
      }
    };

    void finalizeGoogleLogin();
  }, [navigate, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
      Completing Google sign in...
    </div>
  );
}
