import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { cn, formatPoints, formatRelativeTime, getInitials } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import DashboardLayout from '@/components/DashboardLayout';

function statusStyle(status: string): string {
  switch (status.toLowerCase()) {
    case 'fulfilled':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    case 'approved':
      return 'bg-blue-100 text-blue-700';
    case 'rejected':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function Profile() {
  const navigate = useNavigate();

  const { data: profile, isLoading } = useProfile();
  const [tab, setTab] = useState<'received' | 'given'>('received');

  const activeKudos = useMemo(() => {
    if (!profile) return [];
    return tab === 'received' ? profile.kudosReceived : profile.kudosGiven;
  }, [profile, tab]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {isLoading && <div className="h-96 animate-pulse rounded-2xl bg-white" />}

        {!isLoading && profile && (
          <>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-32 bg-gradient-to-r from-violet-600 via-purple-500 to-orange-400" />
              <div className="px-6 pb-6">
                <div className="-mt-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-violet-500 to-pink-500 text-3xl font-bold text-white shadow-lg">
                      {getInitials(profile.fullName)}
                    </div>
                    <div className="pb-1">
                      <h1 className="text-4xl font-extrabold text-slate-900">{profile.fullName}</h1>
                      <p className="text-base text-slate-500">
                        {profile.role} · {profile.departmentName ?? 'General'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/settings')}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Giveable Points</p>
                <p className="mt-1 text-5xl font-extrabold text-amber-600">
                  {profile.giveableBalance}
                </p>
                <p className="text-sm text-slate-400">Monthly budget</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Redeemable Points</p>
                <p className="mt-1 text-5xl font-extrabold text-violet-600">
                  {profile.redeemableBalance}
                </p>
                <p className="text-sm text-slate-400">Earned wallet</p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-4xl font-extrabold text-slate-900">
                  {profile.stats.kudosReceived}
                </p>
                <p className="text-sm text-slate-500">Kudos Received</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-4xl font-extrabold text-slate-900">{profile.stats.kudosGiven}</p>
                <p className="text-sm text-slate-500">Kudos Given</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-4xl font-extrabold text-slate-900">
                  {formatPoints(profile.stats.totalPointsEarned)}
                </p>
                <p className="text-sm text-slate-500">Points Earned</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-4xl font-extrabold text-slate-900">
                  {formatPoints(profile.stats.totalPointsSpent)}
                </p>
                <p className="text-sm text-slate-500">Points Spent</p>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-3xl font-bold text-slate-900">Kudos History</h2>
                <div className="rounded-xl bg-slate-100 p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setTab('received')}
                    className={cn(
                      'rounded-lg px-3 py-1.5 font-medium transition',
                      tab === 'received' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500',
                    )}
                  >
                    Received
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('given')}
                    className={cn(
                      'rounded-lg px-3 py-1.5 font-medium transition',
                      tab === 'given' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500',
                    )}
                  >
                    Given
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {activeKudos.slice(0, 6).map((kudos) => {
                  const actorName = tab === 'received' ? kudos.giverName : kudos.receiverName;
                  return (
                    <article key={kudos.id} className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                          {getInitials(actorName)}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-base">
                            <span className="font-bold text-slate-900">{actorName}</span>
                            <span className="text-slate-400">
                              {tab === 'received' ? 'gave you' : 'received'}
                            </span>
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-700">
                              +{formatPoints(kudos.points)}
                            </span>
                          </div>
                          <p className="mt-1 text-lg text-slate-700">"{kudos.message}"</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {kudos.valueEmoji} {kudos.valueName}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatRelativeTime(kudos.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-3xl font-bold text-slate-900">Redemption History</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50 text-sm uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Reward</th>
                      <th className="px-5 py-3 font-semibold">Points</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-base">
                    {profile.redemptions.map((redemption) => (
                      <tr key={redemption.id}>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {redemption.rewardName}
                        </td>
                        <td className="px-5 py-4 font-semibold text-violet-600">
                          {formatPoints(redemption.pointsSpent)}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {new Date(redemption.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-semibold capitalize',
                              statusStyle(redemption.status),
                            )}
                          >
                            {redemption.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
