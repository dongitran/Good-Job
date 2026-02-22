import { useState, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { usePointBalance } from '@/hooks/usePointBalance';
import { useOrg } from '@/hooks/useOrg';
import { useTheme } from '@/hooks/useUserPreferences';
import Sidebar from '@/pages/dashboard/components/Sidebar';
import DashboardHeader from '@/pages/dashboard/components/DashboardHeader';
import GiveKudosModal from '@/pages/dashboard/components/GiveKudosModal';
import { KudosModalContext } from './useOpenKudosModal';

/**
 * Shared shell for every authenticated page.
 *
 * Encapsulates Sidebar + DashboardHeader + GiveKudosModal so individual
 * pages only need to supply their `<main>` content as `children`.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const { data: balance } = usePointBalance();
  const { data: org } = useOrg(user?.orgId);
  useTheme(); // Apply user's persisted theme preference

  const [showKudos, setShowKudos] = useState(false);

  const activeCoreValues = org?.coreValues?.filter((v) => v.isActive) ?? [];

  return (
    <KudosModalContext.Provider value={() => setShowKudos(true)}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar onGiveKudos={() => setShowKudos(true)} user={user} orgName={org?.name} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader balance={balance} user={user} />

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>

        {showKudos && (
          <GiveKudosModal
            orgId={user?.orgId ?? ''}
            coreValues={activeCoreValues}
            giveableBalance={balance?.giveableBalance ?? 0}
            onClose={() => setShowKudos(false)}
          />
        )}
      </div>
    </KudosModalContext.Provider>
  );
}
