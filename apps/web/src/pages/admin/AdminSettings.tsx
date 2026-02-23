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
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Organization Settings
          </h1>
          <p className="mt-1 text-lg text-slate-500">
            Configure recognition program, values, and billing
          </p>
        </section>

        <section className="overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max items-center gap-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'border-b-2 px-1 py-3 text-sm font-medium transition',
                  activeTab === tab.id
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

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
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'integrations' && <IntegrationsTab />}
            {activeTab === 'billing' && <BillingTab org={org} />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
