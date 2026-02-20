import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ProfileKudosItem {
  id: string;
  points: number;
  message: string;
  valueName: string;
  valueEmoji: string;
  giverName: string;
  giverAvatarUrl: string | null;
  receiverName: string;
  receiverAvatarUrl: string | null;
  createdAt: string;
}

export interface ProfileRedemptionItem {
  id: string;
  rewardName: string;
  rewardImageUrl: string | null;
  pointsSpent: number;
  status: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  departmentName: string | null;
  giveableBalance: number;
  redeemableBalance: number;
  stats: {
    kudosReceived: number;
    kudosGiven: number;
    totalPointsEarned: number;
    totalPointsSpent: number;
  };
  kudosReceived: ProfileKudosItem[];
  kudosGiven: ProfileKudosItem[];
  redemptions: ProfileRedemptionItem[];
}

export function useProfile() {
  return useQuery({
    queryKey: ['users', 'profile'],
    queryFn: () => api.get<UserProfile>('/users/profile').then((r) => r.data),
  });
}
