import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  category: string;
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
  canAfford: boolean;
}

export interface RewardStats {
  availablePoints: number;
  totalEarned: number;
  rewardsRedeemed: number;
  pointsSpent: number;
  lastRedeemedAt: string | null;
}

export function useRewards(category?: string) {
  return useQuery({
    queryKey: ['rewards', category],
    queryFn: () =>
      api
        .get<RewardItem[]>('/rewards', { params: category ? { category } : {} })
        .then((r) => r.data),
  });
}

export function useRewardStats() {
  return useQuery({
    queryKey: ['rewards', 'stats'],
    queryFn: () => api.get<RewardStats>('/rewards/stats').then((r) => r.data),
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rewardId, idempotencyKey }: { rewardId: string; idempotencyKey: string }) =>
      api.post(`/rewards/${rewardId}/redeem`, { idempotencyKey }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewards', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
}
