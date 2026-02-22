import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OrgData } from '@/types/org';

/**
 * Fetches the current user's organization data (name, core values, etc.).
 * Shared hook — replaces 6 inline useQuery copies across pages.
 */
export function useOrg(orgId: string | undefined) {
  return useQuery<OrgData>({
    queryKey: ['org', orgId],
    queryFn: () => api.get(`/organizations/${orgId}`).then((r) => r.data as OrgData),
    enabled: !!orgId,
  });
}
