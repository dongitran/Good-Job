import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Award, Star, Flame, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatPoints } from '@/lib/utils';
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

interface LeaderboardUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  count: number;
  points: number;
}

interface Analytics {
  topGivers: LeaderboardUser[];
  topReceivers: LeaderboardUser[];
}

const PERIODS = [
  { key: 7, label: 'Last 7 days' },
  { key: 30, label: 'Last 30 days' },
  { key: 90, label: 'Last 90 days' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const rankColor = [
  'bg-amber-400 text-white',
  'bg-slate-400 text-white',
  'bg-orange-700 text-white',
];
const rankIcon = [
  <Trophy key="1" className="h-3.5 w-3.5" />,
  <Medal key="2" className="h-3.5 w-3.5" />,
  <Award key="3" className="h-3.5 w-3.5" />,
];

function LeaderboardCard({
  user: member,
  rank,
  metric,
}: {
  user: LeaderboardUser;
  rank: number;
  metric: 'received' | 'given';
}) {
  const isTopThree = rank <= 3;
  const badgeClass = rankColor[rank - 1] ?? 'bg-slate-100 text-slate-600';

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl px-4 py-3.5 transition',
        isTopThree
          ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 shadow-sm'
          : 'border border-slate-100 bg-white hover:bg-slate-50',
      )}
    >
      {/* Rank badge */}
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
          isTopThree ? badgeClass : 'bg-slate-100 text-slate-500',
        )}
      >
        {rank <= 3 ? rankIcon[rank - 1] : rank}
      </div>

      {/* Avatar */}
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.fullName}
          className="h-10 w-10 rounded-full object-cover shadow-sm"
        />
      ) : (
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm',
            isTopThree
              ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
              : 'bg-slate-300 text-slate-700',
          )}
        >
          {getInitials(member.fullName || '?')}
        </div>
      )}

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="truncate font-semibold text-slate-800">{member.fullName}</p>
        <p className="text-xs text-slate-400">
          {metric === 'received' ? `${member.count} kudos received` : `${member.count} kudos given`}
        </p>
      </div>

      {/* Points */}
      <div className="text-right">
        <p className="text-lg font-extrabold text-violet-600">{formatPoints(member.points)}</p>
        <p className="text-xs text-slate-400">pts</p>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const user = useAuthStore((s) => s.user);
  const { data: balance } = usePointBalance();
  const [showKudos, setShowKudos] = useState(false);
  const [period, setPeriod] = useState(30);
  const [tab, setTab] = useState<'received' | 'given'>('received');

  const { data: org } = useQuery<OrgData>({
    queryKey: ['org', user?.orgId],
    queryFn: () => api.get(`/organizations/${user?.orgId}`).then((r) => r.data as OrgData),
    enabled: !!user?.orgId,
  });

  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['admin', 'analytics', period],
    queryFn: () => api.get(`/admin/analytics?days=${period}`).then((r) => r.data as Analytics),
  });

  const activeCoreValues = org?.coreValues?.filter((v) => v.isActive) ?? [];
  const leaders =
    tab === 'received' ? (analytics?.topReceivers ?? []) : (analytics?.topGivers ?? []);

  // find current user's rank
  const myRank = leaders.findIndex((u) => u.id === user?.id) + 1;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar onGiveKudos={() => setShowKudos(true)} user={user} orgName={org?.name} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader balance={balance} user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Hero Header */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-8 text-white shadow-xl">
              <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold">Leaderboard</h1>
                    <p className="text-violet-200">Top performers in your organization</p>
                  </div>
                </div>

                {myRank > 0 && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
                    <Star className="h-4 w-4 text-amber-300" />
                    You're ranked #{myRank} on this leaderboard
                  </div>
                )}
              </div>
            </section>

            {/* Period selector */}
            <section className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                {PERIODS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPeriod(key)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-semibold transition',
                      period === key ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                {(['received', 'given'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition',
                      tab === t ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500',
                    )}
                  >
                    {t === 'received' ? (
                      <Award className="h-4 w-4" />
                    ) : (
                      <Flame className="h-4 w-4" />
                    )}
                    Most {t}
                  </button>
                ))}
              </div>
            </section>

            {/* Top 3 podium */}
            {!isLoading && leaders.length >= 3 && (
              <section className="grid grid-cols-3 gap-4">
                {[1, 0, 2].map((idx) => {
                  const member = leaders[idx];
                  if (!member) return null;
                  const rank = idx + 1;
                  const podiumHeight = idx === 0 ? 'pt-0' : idx === 1 ? 'pt-8' : 'pt-12';
                  return (
                    <div
                      key={member.id}
                      className={cn('flex flex-col items-center gap-2', podiumHeight)}
                    >
                      {rank === 1 && <Trophy className="h-6 w-6 text-amber-500 animate-bounce" />}
                      {rank === 2 && <Medal className="h-5 w-5 text-slate-400" />}
                      {rank === 3 && <Award className="h-5 w-5 text-orange-700" />}
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.fullName}
                          className={cn(
                            'rounded-full object-cover border-4 shadow-lg',
                            rank === 1
                              ? 'h-20 w-20 border-amber-400'
                              : 'h-16 w-16 border-slate-300',
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            'flex items-center justify-center rounded-full font-bold text-white shadow-lg border-4',
                            rank === 1
                              ? 'h-20 w-20 text-xl bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400'
                              : rank === 2
                                ? 'h-16 w-16 bg-slate-400 border-slate-300'
                                : 'h-16 w-16 bg-orange-700 border-orange-700/50',
                          )}
                        >
                          {getInitials(member.fullName || '?')}
                        </div>
                      )}
                      <p className="text-center text-sm font-bold text-slate-800">
                        {member.fullName}
                      </p>
                      <p className="font-extrabold text-violet-600">
                        {formatPoints(member.points)} pts
                      </p>
                      <div
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-bold text-white',
                          rank === 1
                            ? 'bg-amber-400'
                            : rank === 2
                              ? 'bg-slate-400'
                              : 'bg-orange-700',
                        )}
                      >
                        #{rank}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Full list */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 px-1">
                <TrendingUp className="h-4 w-4" />
                Full Rankings
              </div>

              {isLoading && (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-xl bg-white border border-slate-100"
                    />
                  ))}
                </div>
              )}

              {!isLoading && leaders.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <Trophy className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-slate-400">No data for this period yet.</p>
                </div>
              )}

              {!isLoading &&
                leaders.map((member, idx) => (
                  <div
                    key={member.id}
                    className={cn(
                      idx === leaders.findIndex((u) => u.id === user?.id)
                        ? 'ring-2 ring-violet-400 rounded-xl'
                        : '',
                    )}
                  >
                    <LeaderboardCard user={member} rank={idx + 1} metric={tab} />
                  </div>
                ))}
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
