import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface FeedUser {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface FeedCoreValue {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
}

export interface FeedItem {
  id: string;
  orgId: string;
  points: number;
  message: string;
  isPrivate: boolean;
  createdAt: string;
  giver: FeedUser;
  receiver: FeedUser;
  coreValue: FeedCoreValue | null;
  reactionCount: number;
  commentCount: number;
}

interface FeedPage {
  items: FeedItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useFeed(orgId: string, valueId?: string) {
  return useInfiniteQuery<FeedPage>({
    queryKey: ['feed', orgId, valueId],
    queryFn: ({ pageParam }) =>
      api
        .get('/feed', { params: { page: pageParam, limit: 20, valueId } })
        .then((r) => r.data as FeedPage),
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    initialPageParam: 1,
    enabled: !!orgId,
  });
}
