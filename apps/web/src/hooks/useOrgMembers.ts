import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface OrgMember {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: 'member' | 'admin' | 'owner';
}

export function useOrgMembers(orgId: string, q: string) {
  return useQuery<OrgMember[]>({
    queryKey: ['members', orgId, q],
    queryFn: () =>
      api
        .get(`/organizations/${orgId}/members`, { params: { q } })
        .then((r) => r.data as OrgMember[]),
    enabled: !!orgId && q.length >= 1,
    staleTime: 10_000,
  });
}
