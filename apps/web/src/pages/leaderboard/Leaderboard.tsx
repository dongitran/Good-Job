import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { usePointBalance } from '@/hooks/usePointBalance';
import { useAuthStore } from '@/stores/auth-store';
import Sidebar from '@/pages/dashboard/components/Sidebar';
import DashboardHeader from '@/pages/dashboard/components/DashboardHeader';
import GiveKudosModal from '@/pages/dashboard/components/GiveKudosModal';

interface CoreValue {
  id: string;
  name: string;
  emoji?: string;
  isActive: boolean;
}

interface OrgData {
  id: string;
  name: string;
  coreValues?: CoreValue[];
}

export default function Leaderboard() {
  const user = useAuthStore((s) => s.user);
  const { data: balance } = usePointBalance();
  const [showKudos, setShowKudos] = useState(false);

  const { data: org } = useQuery<OrgData>({
    queryKey: ['org', user?.orgId],
    queryFn: () => api.get(`/organizations/${user?.orgId}`).then((r) => r.data as OrgData),
    enabled: !!user?.orgId,
  });

  const activeCoreValues = org?.coreValues?.filter((value) => value.isActive) ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar onGiveKudos={() => setShowKudos(true)} user={user} orgName={org?.name} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader balance={balance} user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Trophy className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Leaderboard</h1>
              <p className="mt-2 text-base text-slate-500">
                Track top recognizers and point earners across your organization.
              </p>
            </section>
          </div>
        </main>
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
  );
}
