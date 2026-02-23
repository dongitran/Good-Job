import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CoreValue, OrgData } from '@/types/org';

interface CoreValueInput {
  name: string;
  emoji?: string;
  description?: string;
  color?: string;
}

interface UpdateOrgPayload {
  name?: string;
  logoUrl?: string | null;
  companyDomain?: string;
  timezone?: string;
  language?: string;
  settings?: {
    points?: {
      minPerKudo?: number;
      maxPerKudo?: number;
      valueInCurrency?: number;
      currency?: string;
    };
    budget?: {
      monthlyGivingBudget?: number;
      resetDay?: number;
      allowRollover?: boolean;
      managerBonusEnabled?: boolean;
      managerBonusAmount?: number;
    };
    notifications?: {
      emailDigest?: boolean;
      pushNotifications?: boolean;
      slackPosts?: boolean;
      monthlyLeaderboard?: boolean;
    };
  };
}

interface OrganizationExportPayload {
  fileName: string;
  contentType: 'text/csv';
  generatedAt: string;
  rowCount: number;
  csv: string;
}

export function useOrgSettings(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidateOrg = async () => {
    if (!orgId) return;
    await queryClient.invalidateQueries({ queryKey: ['org', orgId] });
  };

  const updateOrg = useMutation({
    mutationFn: async (payload: UpdateOrgPayload) => {
      if (!orgId) throw new Error('Organization id is required.');
      const { data } = await api.patch(`/organizations/${orgId}`, payload);
      return data as OrgData;
    },
    onSuccess: invalidateOrg,
  });

  const addCoreValues = useMutation({
    mutationFn: async (values: CoreValueInput[]) => {
      if (!orgId) throw new Error('Organization id is required.');
      const { data } = await api.post(`/organizations/${orgId}/core-values`, {
        values,
        replaceExisting: false,
      });
      return data as CoreValue[];
    },
    onSuccess: invalidateOrg,
  });

  const updateCoreValue = useMutation({
    mutationFn: async (input: { valueId: string; payload: Partial<CoreValueInput> }) => {
      if (!orgId) throw new Error('Organization id is required.');
      const { data } = await api.patch(
        `/organizations/${orgId}/core-values/${input.valueId}`,
        input.payload,
      );
      return data as CoreValue;
    },
    onSuccess: invalidateOrg,
  });

  const deleteCoreValue = useMutation({
    mutationFn: async (valueId: string) => {
      if (!orgId) throw new Error('Organization id is required.');
      await api.delete(`/organizations/${orgId}/core-values/${valueId}`);
    },
    onSuccess: invalidateOrg,
  });

  const reorderCoreValues = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      if (!orgId) throw new Error('Organization id is required.');
      const { data } = await api.patch(`/organizations/${orgId}/core-values/reorder`, {
        orderedIds,
      });
      return data as CoreValue[];
    },
    onSuccess: invalidateOrg,
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      if (!orgId) throw new Error('Organization id is required.');
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<{ logoUrl: string }>(
        `/organizations/${orgId}/logo`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return data.logoUrl;
    },
    onSuccess: invalidateOrg,
  });

  const exportData = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('Organization id is required.');
      const { data } = await api.post(`/organizations/${orgId}/export`);
      return data as OrganizationExportPayload;
    },
  });

  return {
    updateOrg,
    addCoreValues,
    updateCoreValue,
    deleteCoreValue,
    reorderCoreValues,
    uploadLogo,
    exportData,
  };
}

export type OrgSettingsMutations = ReturnType<typeof useOrgSettings>;
