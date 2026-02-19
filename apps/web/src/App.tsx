import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Landing from './pages/Landing';
import AuthCallback from './pages/AuthCallback';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/onboarding/Onboarding';
import { api, setAuthToken } from './lib/api';
import { useAuthStore } from './stores/auth-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Attempt to restore an authenticated session on page load using the
 * HttpOnly refresh cookie. If the cookie is still valid, the server issues
 * a new access token so the user doesn't have to re-login after a page refresh.
 */
function useSessionRestore() {
  const [ready, setReady] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        // Use the HttpOnly refresh cookie (sent automatically via withCredentials)
        const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
        if (!cancelled && data.accessToken) {
          setAuthToken(data.accessToken);
          // Fetch the user profile with the new token
          const me = await api.get('/auth/me');
          if (!cancelled && me.data?.email) {
            setUser({
              id: String(me.data.sub ?? crypto.randomUUID()),
              email: String(me.data.email),
              fullName: String(me.data.fullName ?? me.data.email),
              role: me.data.role ?? 'member',
              orgId: me.data.orgId ? String(me.data.orgId) : '',
              onboardingCompletedAt: me.data.onboardingCompletedAt ?? null,
            });
          }
        }
      } catch {
        // No valid refresh cookie — user needs to log in manually
        setAuthToken(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return ready;
}

/**
 * Redirects authenticated users who haven't completed onboarding to /onboarding.
 * Allows public routes (auth callback, verify, reset) to work without redirect.
 */
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  const publicPaths = ['/auth/callback', '/verify-email', '/reset-password'];
  const isPublicPath = publicPaths.some((p) => location.pathname.startsWith(p));

  if (
    isAuthenticated &&
    !user?.onboardingCompletedAt &&
    !isPublicPath &&
    !location.pathname.startsWith('/onboarding')
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function App() {
  const ready = useSessionRestore();

  // Show nothing until session restore attempt completes (typically <200ms)
  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OnboardingGuard>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Authenticated - To be added */}
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          </Routes>
        </OnboardingGuard>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
