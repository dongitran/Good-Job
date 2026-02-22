import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
});

// ─── In-memory token storage (never touches localStorage) ─────────────────────
// Access tokens are XSS-sensitive; keeping them in memory prevents theft via
// injected scripts that read `localStorage.getItem('access_token')`.
let _authToken: string | null = null;

/**
 * Set or clear the in-memory access token.
 * Called by AuthCallback, Landing, and the refresh interceptor.
 */
export function setAuthToken(token: string | null): void {
  _authToken = token;
}

// Request interceptor: attach access token from memory
api.interceptors.request.use((config) => {
  if (_authToken) {
    config.headers.Authorization = `Bearer ${_authToken}`;
  }
  return config;
});

// Track whether a refresh is already in progress to prevent parallel attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Response interceptor: handle 401 with token refresh (single attempt, no loop)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh once per request, and never for auth endpoints
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Coalesce concurrent refresh attempts into a single request
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = axios
        .post(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true })
        .then(({ data }) => {
          const token = data.accessToken as string;
          setAuthToken(token);
          return token;
        })
        .catch(() => {
          setAuthToken(null);
          // Redirect to landing page (not /login which doesn't exist)
          window.location.href = '/';
          return null;
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return api(originalRequest);
  },
);

// ─── Shared Axios error extraction ────────────────────────────────────────────
/**
 * Safely extracts a human-readable error message from an Axios error response.
 * Falls back to a generic message if the response structure is unexpected.
 */
export function extractApiError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
      'string'
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }
  return fallback;
}
