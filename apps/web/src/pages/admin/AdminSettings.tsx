import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/stores/auth-store';
import { useOrg } from '@/hooks/useOrg';
import { useOrgSettings } from '@/hooks/useOrgSettings';
import GeneralTab from './settings/GeneralTab';
import CompanyValuesTab from './settings/CompanyValuesTab';
import PointsBudgetTab from './settings/PointsBudgetTab';
import NotificationsTab from './settings/NotificationsTab';
import IntegrationsTab from './settings/IntegrationsTab';
import BillingTab from './settings/BillingTab';
import { cn } from '@/lib/utils';

type SettingsTab = 'general' | 'values' | 'budget' | 'notifications' | 'integrations' | 'billing';

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'values', label: 'Company Values' },
  { id: 'budget', label: 'Points & Budgets' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'billing', label: 'Billing' },
];

export default function AdminSettings() {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.orgId;
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const { data: org, isLoading } = useOrg(orgId);
  const settingsMutations = useOrgSettings(orgId);

  return (
    <DashboardLayout>
      {/* Page Header + Tabs */}
      <div className="-mx-6 -mt-6 bg-white">
        <div className="px-6 pt-4">
          <h1 className="text-base font-bold text-slate-900">Organization Settings</h1>
          <p className="text-xs text-slate-400">
            Configure recognition program, values, and billing
          </p>
        </div>
        <div className="mt-3 border-b border-slate-200/80 px-6">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'border-b-2 py-3 text-sm transition',
                  activeTab === tab.id
                    ? 'border-violet-600 font-semibold text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-violet-600',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-6">
        {isLoading && <div className="h-64 animate-pulse rounded-2xl bg-white" />}

        {!isLoading && org && (
          <>
            {activeTab === 'general' && (
              <GeneralTab org={org} settingsMutations={settingsMutations} />
            )}
            {activeTab === 'values' && (
              <CompanyValuesTab org={org} settingsMutations={settingsMutations} />
            )}
            {activeTab === 'budget' && (
              <PointsBudgetTab org={org} settingsMutations={settingsMutations} />
            )}
            {activeTab === 'notifications' && (
              <NotificationsTab org={org} settingsMutations={settingsMutations} />
            )}
            {activeTab === 'integrations' && <IntegrationsTab />}
            {activeTab === 'billing' && <BillingTab org={org} />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
