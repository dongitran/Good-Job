import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Landing from './pages/Landing';
import AuthCallback from './pages/AuthCallback';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import Onboarding from './pages/onboarding/Onboarding';
import Dashboard from './pages/dashboard/Dashboard';
import Rewards from './pages/rewards/Rewards';
import Leaderboard from './pages/leaderboard/Leaderboard';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRewards from './pages/admin/AdminRewards';
import AdminSettings from './pages/admin/AdminSettings';
import { api, setAuthToken } from './lib/api';
import { fetchAndMapAuthUser } from './lib/auth-helpers';
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
          const user = await fetchAndMapAuthUser();
          if (!cancelled) {
            setUser(user);
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

  const publicPaths = ['/auth/callback', '/verify-email', '/reset-password', '/register'];
  const isPublicPath = publicPaths.some((p) => location.pathname.startsWith(p));

  if (
    isAuthenticated &&
    !user?.onboardingCompletedAt &&
    !isPublicPath &&
    !location.pathname.startsWith('/onboarding')
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect onboarded users away from landing page to dashboard
  if (isAuthenticated && user?.onboardingCompletedAt && location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * Redirects unauthenticated users to the landing page.
 * Wraps all routes that require a logged-in session.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Redirects non-admin users away from admin pages.
 * Only users with 'admin' or 'owner' role can access these routes.
 */
function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
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
            <Route path="/register" element={<Register />} />

            {/* Onboarding */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Authenticated */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute>
                  <Rewards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Admin — protected by AdminGuard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminGuard>
                    <AdminDashboard />
                  </AdminGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminGuard>
                    <AdminUsers />
                  </AdminGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rewards"
              element={
                <ProtectedRoute>
                  <AdminGuard>
                    <AdminRewards />
                  </AdminGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminGuard>
                    <AdminSettings />
                  </AdminGuard>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OnboardingGuard>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

export default App;
