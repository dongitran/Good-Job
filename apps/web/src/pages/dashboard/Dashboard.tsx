import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { usePointBalance } from '@/hooks/usePointBalance';
import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';
import GreetingCard from './components/GreetingCard';
import RecognitionFeed from './components/RecognitionFeed';
import GiveKudosModal from './components/GiveKudosModal';

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

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: balance } = usePointBalance();
  const [showKudos, setShowKudos] = useState(false);
  const [activeValueId, setActiveValueId] = useState<string | undefined>();

  const { data: org } = useQuery<OrgData>({
    queryKey: ['org', user?.orgId],
    queryFn: () => api.get(`/organizations/${user?.orgId}`).then((r) => r.data as OrgData),
    enabled: !!user?.orgId,
  });

  const activeCoreValues = org?.coreValues?.filter((v) => v.isActive) ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar onGiveKudos={() => setShowKudos(true)} user={user} orgName={org?.name} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader balance={balance} user={user} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <GreetingCard
            giveableBalance={balance?.giveableBalance ?? 0}
            user={user}
            onGiveKudos={() => setShowKudos(true)}
          />

          <RecognitionFeed
            orgId={user?.orgId ?? ''}
            coreValues={activeCoreValues}
            activeValueId={activeValueId}
            onValueChange={setActiveValueId}
          />
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
