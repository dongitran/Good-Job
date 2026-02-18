import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'member' | 'admin' | 'owner';
  orgId: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAccessToken: (token) => set({ accessToken: token }),
  logout: async () => {
    // Revoke server-side refresh token before clearing local state.
    // Fire-and-forget: even if the API call fails, we still clear local state.
    if (get().isAuthenticated) {
      try {
        // Import lazily to avoid circular dep; api module reads token from this store.
        const { api, setAuthToken } = await import('../lib/api');
        await api.post('/auth/logout');
        setAuthToken(null);
      } catch {
        // Ignore errors — always complete client-side logout
      }
    }
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
