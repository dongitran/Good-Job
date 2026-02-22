import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useEffect } from 'react';

interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notificationSettings: {
    kudosReceived: boolean;
    weeklyDigest: boolean;
    redemptionStatus: boolean;
    newAnnouncements: boolean;
  };
}

export function useUserPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery<UserPreferences>({
    queryKey: ['user-preferences'],
    queryFn: () => api.get('/user-preferences').then((r) => r.data as UserPreferences),
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Pick<UserPreferences, 'theme' | 'notificationSettings'>>) =>
      api.patch('/user-preferences', data).then((r) => r.data as UserPreferences),
    onSuccess: (updated) => {
      queryClient.setQueryData(['user-preferences'], updated);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    updatePreferences: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

/**
 * Apply theme to `<html>` element. Call this at the app root or in a layout.
 */
export function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system: follow OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}

/**
 * Hook that automatically applies the user's theme preference and listens for OS changes.
 */
export function useTheme() {
  const { preferences } = useUserPreferences();
  const theme = preferences?.theme ?? 'system';

  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  return theme;
}
