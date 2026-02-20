import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AdminRewardItem {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  category: string;
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
  totalRedeemed: number;
  createdAt: string;
}

export interface AdminRewardStats {
  totalRewards: number;
  activeRewards: number;
  redeemedThisMonth: number;
  pointsSpentThisMonth: number;
}

export interface AdminRedemption {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rewardId: string;
  rewardName: string;
  rewardCategory: string;
  pointsSpent: number;
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected';
  fulfilledAt: string | null;
  createdAt: string;
}

export interface CreateRewardPayload {
  name: string;
  description?: string;
  pointsCost: number;
  category: string;
  imageUrl?: string;
  stock: number;
}

export type UpdateRewardPayload = Partial<CreateRewardPayload>;

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminRewards(params?: {
  category?: string;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
}) {
  return useQuery<AdminRewardItem[]>({
    queryKey: ['admin', 'rewards', params],
    queryFn: async () => {
      const res = await api.get('/rewards/admin', { params });
      return res.data as AdminRewardItem[];
    },
  });
}

export function useAdminRewardStats() {
  return useQuery<AdminRewardStats>({
    queryKey: ['admin', 'rewards', 'stats'],
    queryFn: async () => {
      const res = await api.get('/rewards/admin/stats');
      return res.data as AdminRewardStats;
    },
  });
}

export function useAdminRedemptions(params?: { status?: string; search?: string }) {
  return useQuery<AdminRedemption[]>({
    queryKey: ['admin', 'redemptions', params],
    queryFn: async () => {
      const res = await api.get('/admin/redemptions', { params });
      return res.data as AdminRedemption[];
    },
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRewardPayload) =>
      api.post('/rewards/admin', payload).then((r) => r.data as AdminRewardItem),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'rewards'] });
    },
  });
}

export function useUpdateReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateRewardPayload) =>
      api.patch(`/rewards/admin/${id}`, payload).then((r) => r.data as AdminRewardItem),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'rewards'] });
    },
  });
}

export function useDisableReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/rewards/admin/${id}/disable`).then((r) => r.data as AdminRewardItem),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'rewards'] });
    },
  });
}

export function useEnableReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/rewards/admin/${id}/enable`).then((r) => r.data as AdminRewardItem),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'rewards'] });
    },
  });
}

export function useRestockReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.post(`/rewards/admin/${id}/restock`, { quantity }).then((r) => r.data as AdminRewardItem),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'rewards'] });
    },
  });
}

export function useDeleteReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/rewards/admin/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'rewards'] });
    },
  });
}

export function useUpdateRedemptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/redemptions/${id}/status`, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'redemptions'] });
    },
  });
}
