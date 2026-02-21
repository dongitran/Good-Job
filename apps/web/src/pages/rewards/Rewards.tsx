import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import Sidebar from '@/pages/dashboard/components/Sidebar';
import DashboardHeader from '@/pages/dashboard/components/DashboardHeader';
import GiveKudosModal from '@/pages/dashboard/components/GiveKudosModal';
import { api } from '@/lib/api';
import { cn, formatPoints, formatRelativeTime } from '@/lib/utils';
import { usePointBalance } from '@/hooks/usePointBalance';
import { RewardItem, useRedeemReward, useRewards, useRewardStats } from '@/hooks/useRewards';

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

const categoryOptions = [
  { key: 'all', label: 'All', emoji: '' },
  { key: 'swag', label: 'Swag', emoji: '👕' },
  { key: 'gift_card', label: 'Gift Cards', emoji: '🎟️' },
  { key: 'time_off', label: 'Time Off', emoji: '🏖️' },
  { key: 'experience', label: 'Experiences', emoji: '🍽️' },
  { key: 'charity', label: 'Charity', emoji: '💝' },
] as const;

const colorByCategory: Record<string, string> = {
  swag: 'bg-violet-100',
  gift_card: 'bg-amber-100',
  time_off: 'bg-emerald-100',
  experience: 'bg-purple-100',
  charity: 'bg-sky-100',
};

const emojiByCategory: Record<string, string> = {
  swag: '👕',
  gift_card: '🎟️',
  time_off: '🏖️',
  experience: '🍽️',
  charity: '💝',
};

function stockLabel(stock: number): { text: string; className: string } {
  if (stock === 0) return { text: 'Out of Stock', className: 'bg-rose-100 text-rose-700' };
  if (stock > 0 && stock <= 3)
    return { text: `Limited (${stock} left)`, className: 'bg-amber-100 text-amber-700' };
  if (stock < 0) return { text: 'Unlimited', className: 'bg-emerald-100 text-emerald-700' };
  return { text: 'In Stock', className: 'bg-emerald-100 text-emerald-700' };
}

export default function Rewards() {
  const user = useAuthStore((s) => s.user);
  const { data: balance } = usePointBalance();
  const [showKudos, setShowKudos] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: org } = useQuery<OrgData>({
    queryKey: ['org', user?.orgId],
    queryFn: () => api.get(`/organizations/${user?.orgId}`).then((r) => r.data as OrgData),
    enabled: !!user?.orgId,
  });

  const rewardsQueryCategory = activeCategory === 'all' ? undefined : activeCategory;
  const { data: rewards = [], isLoading } = useRewards(rewardsQueryCategory);
  const { data: rewardStats } = useRewardStats();
  const redeemReward = useRedeemReward();

  const activeCoreValues = org?.coreValues?.filter((v) => v.isActive) ?? [];

  const selectedAfterBalance = useMemo(() => {
    if (!selectedReward || !rewardStats) return 0;
    return rewardStats.availablePoints - selectedReward.pointsCost;
  }, [selectedReward, rewardStats]);

  const recentRedeemText = rewardStats?.lastRedeemedAt
    ? formatRelativeTime(rewardStats.lastRedeemedAt)
    : 'No redemptions yet';

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;
    try {
      await redeemReward.mutateAsync({
        rewardId: selectedReward.id,
        idempotencyKey: crypto.randomUUID(),
      });
      setShowSuccess(true);
      toast.success('Reward redeemed successfully.');
    } catch {
      toast.error('Could not redeem reward. Please try again.');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar onGiveKudos={() => setShowKudos(true)} user={user} orgName={org?.name} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader balance={balance} user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <section>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Rewards Catalog 🎁
              </h1>
              <p className="mt-2 text-lg text-slate-500">
                Redeem your hard-earned points for awesome perks and rewards
              </p>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 p-5 text-white shadow-sm">
                <p className="text-sm text-white/80">Available Points</p>
                <p className="mt-1 text-5xl font-bold">{rewardStats?.availablePoints ?? 0}</p>
                <p className="text-sm text-white/80">Ready to redeem</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Total Earned</p>
                <p className="mt-1 text-5xl font-bold text-slate-900">
                  {rewardStats?.totalEarned ?? 0}
                </p>
                <p className="text-sm text-emerald-600">Points received all time</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Rewards Redeemed</p>
                <p className="mt-1 text-5xl font-bold text-slate-900">
                  {rewardStats?.rewardsRedeemed ?? 0}
                </p>
                <p className="text-sm text-slate-400">Last: {recentRedeemText}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Points Spent</p>
                <p className="mt-1 text-5xl font-bold text-slate-900">
                  {rewardStats?.pointsSpent ?? 0}
                </p>
                <p className="text-sm text-slate-400">Lifetime total</p>
              </div>
            </section>

            <section className="flex flex-wrap items-center gap-3">
              <p className="mr-1 text-sm font-semibold text-slate-500">Category:</p>
              {categoryOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setActiveCategory(opt.key)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition',
                    activeCategory === opt.key
                      ? 'border-transparent bg-violet-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700',
                  )}
                >
                  {opt.emoji ? `${opt.emoji} ` : ''}
                  {opt.label}
                </button>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {isLoading &&
                [1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white"
                  />
                ))}

              {!isLoading &&
                rewards.map((reward) => {
                  const stock = stockLabel(reward.stock);
                  const canRedeem = reward.canAfford && reward.stock !== 0;

                  return (
                    <article
                      key={reward.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div
                        className={cn(
                          'relative flex h-48 items-center justify-center border-b border-slate-100',
                          colorByCategory[reward.category] ?? 'bg-slate-100',
                        )}
                      >
                        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700">
                          {emojiByCategory[reward.category] ?? '🎁'}{' '}
                          {reward.category.replace('_', ' ')}
                        </span>
                        <span
                          className={cn(
                            'absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold',
                            stock.className,
                          )}
                        >
                          {stock.text}
                        </span>
                        <span className="text-6xl">{emojiByCategory[reward.category] ?? '🎁'}</span>
                      </div>

                      <div className="space-y-3 p-5">
                        <h3 className="text-3xl font-bold text-slate-900">{reward.name}</h3>
                        <p className="min-h-14 text-base text-slate-500">{reward.description}</p>

                        <div className="flex items-center justify-between">
                          <p className="text-4xl font-extrabold text-violet-600">
                            {formatPoints(reward.pointsCost)}
                          </p>
                          <button
                            type="button"
                            disabled={!canRedeem}
                            onClick={() => setSelectedReward(reward)}
                            className={cn(
                              'rounded-xl px-5 py-2.5 text-sm font-semibold transition',
                              canRedeem
                                ? 'bg-violet-600 text-white hover:bg-violet-700'
                                : 'bg-slate-200 text-slate-500',
                            )}
                          >
                            {reward.stock === 0
                              ? 'Out of Stock'
                              : canRedeem
                                ? 'Redeem'
                                : 'Not Enough'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
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

      {selectedReward && !showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReward(null);
          }}
        >
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-slate-900">Confirm Redemption</h2>
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100 text-3xl">
                {emojiByCategory[selectedReward.category] ?? '🎁'}
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{selectedReward.name}</p>
                <p className="text-slate-500">{selectedReward.description}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 p-4 text-lg">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-slate-500">Points Cost</p>
                <p className="font-bold text-violet-600">
                  {formatPoints(selectedReward.pointsCost)}
                </p>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-slate-500">Current Balance</p>
                <p className="font-bold text-slate-900">
                  {formatPoints(rewardStats?.availablePoints ?? 0)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-500">After Redemption</p>
                <p className="font-bold text-emerald-600">{formatPoints(selectedAfterBalance)}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={redeemReward.isPending}
                onClick={() => void handleConfirmRedeem()}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-base font-semibold text-white hover:brightness-105 disabled:opacity-50"
              >
                {redeemReward.isPending ? 'Redeeming...' : 'Confirm Redeem ✨'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReward && showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-18 w-18 items-center justify-center rounded-2xl bg-emerald-100 text-4xl">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-5xl font-extrabold text-slate-900">Redeemed!</h2>
            <p className="mt-2 text-lg text-slate-600">{selectedReward.name} is yours.</p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-base text-slate-500">New Balance</p>
              <p className="text-4xl font-extrabold text-violet-600">
                {formatPoints(selectedAfterBalance)}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedReward(null);
                  setShowSuccess(false);
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Catalog
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedReward(null);
                  setShowSuccess(false);
                }}
                className="rounded-xl bg-violet-600 px-4 py-3 text-base font-semibold text-white hover:bg-violet-700"
              >
                View My Rewards
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
