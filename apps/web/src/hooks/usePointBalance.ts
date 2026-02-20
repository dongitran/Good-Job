import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PointBalance {
  giveableBalance: number;
  redeemableBalance: number;
}

export function usePointBalance() {
  return useQuery<PointBalance>({
    queryKey: ['points', 'balance'],
    queryFn: () => api.get('/points/balance').then((r) => r.data as PointBalance),
  });
}
