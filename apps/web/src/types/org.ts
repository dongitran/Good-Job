// Shared organization types — used across pages and hooks.
// Single source of truth to avoid interface duplication.

export interface CoreValue {
  id: string;
  name: string;
  emoji?: string;
  isActive: boolean;
}

export interface OrgData {
  id: string;
  name: string;
  coreValues?: CoreValue[];
}
