// Shared organization types — used across pages and hooks.
// Single source of truth to avoid interface duplication.

export interface CoreValue {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  sortOrder?: number;
  usageCount?: number;
  isActive: boolean;
}

export interface OrgPointsSettings {
  minPerKudo?: number;
  maxPerKudo?: number;
  valueInCurrency?: number;
  currency?: string;
}

export interface OrgBudgetSettings {
  monthlyGivingBudget?: number;
  resetDay?: number;
  allowRollover?: boolean;
  managerBonusEnabled?: boolean;
  managerBonusAmount?: number;
}

export interface OrgSettings {
  points?: OrgPointsSettings;
  budget?: OrgBudgetSettings;
}

export interface OrgData {
  id: string;
  name: string;
  logoUrl?: string | null;
  coreValues?: CoreValue[];
  industry?: string;
  companySize?: string;
  companyDomain?: string | null;
  timezone?: string | null;
  language?: string | null;
  plan?: string;
  settings?: OrgSettings;
}
