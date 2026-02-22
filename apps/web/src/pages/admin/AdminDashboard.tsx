import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn, formatPoints, formatRelativeTime, getInitials } from '@/lib/utils';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<'givers' | 'receivers'>('givers');

  const { data: analytics, isLoading, isError } = useAdminAnalytics(days);

  const topUsers = useMemo(() => {
    if (!analytics) return [];
    return activeTab === 'givers' ? analytics.topGivers : analytics.topReceivers;
  }, [activeTab, analytics]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-lg text-slate-500">
              Monitor team recognition activity and engagement
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Export Report
            </button>
          </div>
        </section>

        {isLoading && <div className="h-96 animate-pulse rounded-2xl bg-white" />}
        {isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            Could not load analytics data.
          </div>
        )}

        {analytics && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border-t-4 border-violet-500 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Kudos Given</p>
                <p className="mt-1 text-5xl font-extrabold text-slate-900">
                  {analytics.stats.totalRecognitions}
                </p>
              </article>
              <article className="rounded-2xl border-t-4 border-emerald-500 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Active Users</p>
                <p className="mt-1 text-5xl font-extrabold text-slate-900">
                  {analytics.stats.activeUsers}
                </p>
                <p className="text-sm text-emerald-600">
                  {analytics.stats.participationRate}% participation rate
                </p>
              </article>
              <article className="rounded-2xl border-t-4 border-amber-500 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Points Distributed</p>
                <p className="mt-1 text-5xl font-extrabold text-slate-900">
                  {analytics.stats.totalPointsGiven}
                </p>
              </article>
              <article className="rounded-2xl border-t-4 border-blue-500 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Top Distribution</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {analytics.valueDistribution[0]?.name ?? 'No data'}
                </p>
                <p className="text-sm text-slate-500">Most recognized value</p>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
                <div className="mb-3">
                  <h3 className="text-3xl font-bold text-slate-900">Recognition Trend</h3>
                  <p className="text-sm text-slate-500">Kudos and points over time</p>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.recognitionTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => value.slice(5)}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={3} />
                      <Line type="monotone" dataKey="points" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-3xl font-bold text-slate-900">Value Distribution</h3>
                <p className="text-sm text-slate-500">Core values breakdown</p>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.valueDistribution}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-sm">
                  {analytics.valueDistribution.map((value) => (
                    <div key={value.name} className="flex items-center justify-between">
                      <span className="text-slate-600">
                        {value.emoji} {value.name}
                      </span>
                      <span className="font-semibold text-slate-900">{value.count}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white xl:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900">Top Recognizers</h3>
                    <p className="text-sm text-slate-500">Most active members this period</p>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-1 text-sm">
                    <button
                      type="button"
                      onClick={() => setActiveTab('givers')}
                      className={cn(
                        'rounded-lg px-3 py-1.5 font-medium',
                        activeTab === 'givers'
                          ? 'bg-white text-violet-600 shadow-sm'
                          : 'text-slate-500',
                      )}
                    >
                      Givers
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('receivers')}
                      className={cn(
                        'rounded-lg px-3 py-1.5 font-medium',
                        activeTab === 'receivers'
                          ? 'bg-white text-violet-600 shadow-sm'
                          : 'text-slate-500',
                      )}
                    >
                      Receivers
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-5 py-3 font-semibold">User</th>
                        <th className="px-5 py-3 font-semibold">Kudos</th>
                        <th className="px-5 py-3 font-semibold">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topUsers.map((member) => (
                        <tr key={member.id}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                                {getInitials(member.fullName)}
                              </div>
                              <p className="text-base font-semibold text-slate-800">
                                {member.fullName}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-base font-semibold text-slate-700">
                            {member.count}
                          </td>
                          <td className="px-5 py-4 text-base font-semibold text-violet-600">
                            {formatPoints(member.points)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <div className="space-y-4">
                <article className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-2xl font-bold text-slate-900">Recent Activity</h3>
                  <div className="mt-3 space-y-3">
                    {analytics.recentActivity.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {activity.giverName} recognized {activity.receiverName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.valueEmoji} {activity.valueName} · +{activity.points} pts
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-2xl font-bold text-slate-900">Department Breakdown</h3>
                  <div className="mt-3 space-y-2">
                    {analytics.departmentBreakdown.map((dept) => (
                      <div
                        key={dept.name}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{dept.name}</p>
                          <p className="text-xs text-slate-500">{dept.count} recognitions</p>
                        </div>
                        <p className="text-sm font-bold text-violet-600">
                          {formatPoints(dept.points)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
