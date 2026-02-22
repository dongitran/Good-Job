import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { setAuthToken } from '@/lib/api';
import { fetchAndMapAuthUser } from '@/lib/auth-helpers';
import { useAuthStore } from '@/stores/auth-store';

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

      // Store token in memory only — never in localStorage (XSS risk)
      setAuthToken(accessToken);

      try {
        const user = await fetchAndMapAuthUser();
        setUser(user);

        const redirectTo = user.onboardingCompletedAt ? '/dashboard' : '/onboarding';
        window.history.replaceState({}, document.title, redirectTo);
        navigate(redirectTo, { replace: true });
        return;
      } catch {
        setAuthToken(null);
      }
      window.history.replaceState({}, document.title, '/');
      navigate('/', { replace: true });
    };

    void finalizeGoogleLogin();
  }, [navigate, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
      Completing Google sign in...
    </div>
  );
}
