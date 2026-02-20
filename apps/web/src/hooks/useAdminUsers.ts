import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member';
  departmentName: string | null;
  joinedAt: string;
  kudosReceived: number;
  kudosGiven: number;
  pointsEarned: number;
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data as AdminUser[];
    },
  });
}
