import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';
import { usePointBalance } from '@/hooks/usePointBalance';
import { useOrg } from '@/hooks/useOrg';
import DashboardLayout from '@/components/DashboardLayout';
import { useOpenKudosModal } from '@/components/useOpenKudosModal';
import GreetingCard from './components/GreetingCard';
import RecognitionFeed from './components/RecognitionFeed';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: balance } = usePointBalance();
  const [activeValueId, setActiveValueId] = useState<string | undefined>();
  const openKudos = useOpenKudosModal();

  const { data: org } = useOrg(user?.orgId);
  const activeCoreValues = org?.coreValues?.filter((v) => v.isActive) ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <GreetingCard
          giveableBalance={balance?.giveableBalance ?? 0}
          user={user}
          onGiveKudos={openKudos}
          onBrowseRewards={() => navigate('/rewards')}
        />

        <RecognitionFeed
          orgId={user?.orgId ?? ''}
          coreValues={activeCoreValues}
          activeValueId={activeValueId}
          onValueChange={setActiveValueId}
        />
      </div>
    </DashboardLayout>
  );
}
