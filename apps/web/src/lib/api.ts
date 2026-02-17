import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
    const isAuthEndpoint = originalRequest?.url?.startsWith('/api/auth/');
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Coalesce concurrent refresh attempts into a single request
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = axios
        .post('/api/auth/refresh', null, { withCredentials: true })
        .then(({ data }) => {
          const token = data.accessToken as string;
          localStorage.setItem('access_token', token);
          return token;
        })
        .catch(() => {
          localStorage.removeItem('access_token');
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
