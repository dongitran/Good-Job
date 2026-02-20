import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AdminAnalytics {
  stats: {
    totalRecognitions: number;
    activeUsers: number;
    totalPointsGiven: number;
    participationRate: number;
  };
  recognitionTrend: { date: string; count: number; points: number }[];
  valueDistribution: { name: string; emoji: string; count: number; color: string }[];
  topGivers: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    count: number;
    points: number;
  }[];
  topReceivers: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    count: number;
    points: number;
  }[];
  recentActivity: {
    id: string;
    giverName: string;
    receiverName: string;
    points: number;
    message: string;
    valueName: string;
    valueEmoji: string;
    createdAt: string;
  }[];
  departmentBreakdown: { name: string; count: number; points: number }[];
}

export function useAdminAnalytics(days = 30) {
  return useQuery({
    queryKey: ['admin', 'analytics', days],
    queryFn: () =>
      api.get<AdminAnalytics>('/admin/analytics', { params: { days } }).then((r) => r.data),
  });
}
