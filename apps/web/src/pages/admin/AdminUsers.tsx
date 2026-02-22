import { useState } from 'react';
import {
  Search,
  Shield,
  Award,
  Users2,
  TrendingUp,
  Mail,
  Building2,
  UserPlus,
  X,
  Clock,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, formatPoints, formatRelativeTime, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useAdminUsers, AdminUser } from '@/hooks/useAdminUsers';
import DashboardLayout from '@/components/DashboardLayout';

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

const roleBadge: Record<string, string> = {
  owner: 'bg-violet-100 text-violet-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-slate-100 text-slate-600',
};

const roleIcon: Record<string, string> = {
  owner: '👑',
  admin: '🛡️',
  member: '👤',
};

export default function AdminUsers() {
  const user = useAuthStore((s) => s.user);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'joinedAt' | 'kudosReceived' | 'pointsEarned'>('joinedAt');
  const queryClient = useQueryClient();

  const { data: pendingInvitations = [] } = useQuery<PendingInvitation[]>({
    queryKey: ['pending-invitations', user?.orgId],
    queryFn: () =>
      api
        .get(`/organizations/${user?.orgId}/invitations`)
        .then((r) => r.data as PendingInvitation[]),
    enabled: !!user?.orgId,
  });

  const { data: users = [], isLoading } = useAdminUsers();

  const filtered = users
    .filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.departmentName?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'kudosReceived') return b.kudosReceived - a.kudosReceived;
      if (sortBy === 'pointsEarned') return b.pointsEarned - a.pointsEarned;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || !user?.orgId) return;
    setInviting(true);
    try {
      const res = await api.post<{ sent: number; skipped: number; alreadyInvited: string[] }>(
        `/organizations/${user.orgId}/invitations`,
        { emails: [email] },
      );
      const { sent, alreadyInvited } = res.data;
      if (sent > 0) {
        toast.success(`Invitation sent to ${email}`);
        void queryClient.invalidateQueries({ queryKey: ['pending-invitations', user.orgId] });
      }
      if (alreadyInvited.length > 0) {
        toast.warning(`${email} has already been invited. Check the Pending Invitations section.`);
      }
      setInviteEmail('');
      setShowInvite(false);
    } catch {
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(invitationId: string, email: string) {
    if (!user?.orgId) return;
    setRevoking(true);
    try {
      await api.delete(`/organizations/${user.orgId}/invitations/${invitationId}`);
      toast.success(`Invitation to ${email} has been revoked.`);
      void queryClient.invalidateQueries({ queryKey: ['pending-invitations', user.orgId] });
    } catch {
      toast.error('Failed to revoke invitation. Please try again.');
    } finally {
      setRevoking(false);
      setConfirmRevokeId(null);
    }
  }

  // Summary stats
  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalOwners = users.filter((u) => u.role === 'owner').length;
  const topKudosUser = [...users].sort((a, b) => b.kudosReceived - a.kudosReceived)[0];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Team Members</h1>
          <p className="mt-1 text-lg text-slate-500">
            Manage team members and view recognition activity
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            {
              label: 'Total Members',
              value: totalUsers,
              icon: Users2,
              color: 'text-violet-600',
              bg: 'bg-violet-50',
            },
            {
              label: 'Admins',
              value: totalAdmins + totalOwners,
              icon: Shield,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: 'Top Receiver',
              value: topKudosUser?.fullName ?? '—',
              icon: Award,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              isText: true,
            },
            {
              label: 'Most Kudos',
              value: topKudosUser?.kudosReceived ?? 0,
              icon: TrendingUp,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
          ].map(({ label, value, icon: Icon, color, bg, isText }) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', bg)}>
                  <Icon className={cn('h-4 w-4', color)} />
                </div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
              </div>
              <p
                className={cn(
                  'mt-2 font-extrabold text-slate-900',
                  isText ? 'text-xl truncate' : 'text-4xl',
                )}
              >
                {value}
              </p>
            </article>
          ))}
        </section>

        {/* Filters */}
        <section className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="joinedAt">Sort: Join Date</option>
            <option value="kudosReceived">Sort: Kudos Received</option>
            <option value="pointsEarned">Sort: Points Earned</option>
          </select>

          <button
            onClick={() => setShowInvite(true)}
            className="ml-auto flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        </section>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-700">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending Invitations
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {pendingInvitations.length}
              </span>
            </h2>
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
              <table className="min-w-full text-left">
                <thead className="bg-amber-50 text-xs uppercase tracking-wide text-amber-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Invited</th>
                    <th className="px-5 py-3 font-semibold">Expires</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {pendingInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Mail className="h-4 w-4 text-slate-400" />
                          {inv.email}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                          {inv.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          pending
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500">
                        {formatRelativeTime(inv.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500">
                        {formatRelativeTime(inv.expiresAt)}
                      </td>
                      <td className="px-5 py-3">
                        {confirmRevokeId === inv.id ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-rose-600 font-medium">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Sure?
                            </span>
                            <button
                              onClick={() => void handleRevoke(inv.id, inv.email)}
                              disabled={revoking}
                              aria-label="Confirm revoke invitation"
                              className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmRevokeId(null)}
                              disabled={revoking}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRevokeId(inv.id)}
                            aria-label="Revoke invitation"
                            className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Member</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Kudos Received</th>
                  <th className="px-5 py-3 font-semibold">Kudos Given</th>
                  <th className="px-5 py-3 font-semibold">Points Earned</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      Loading members…
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      No members found.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  filtered.map((member: AdminUser) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.fullName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-xs font-bold text-white shadow-sm">
                              {getInitials(member.fullName || 'U')}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">{member.fullName}</p>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {member.departmentName ? (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {member.departmentName}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                            roleBadge[member.role] ?? roleBadge['member'],
                          )}
                        >
                          {roleIcon[member.role] ?? ''} {member.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold text-violet-600">
                            {member.kudosReceived}
                          </span>
                          <span className="text-slate-400 text-sm">kudos</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-semibold tabular-nums">
                        {member.kudosGiven}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-emerald-600">
                          {formatPoints(member.pointsEarned)}
                        </span>
                        <span className="text-slate-400 text-xs ml-1">pts</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatRelativeTime(member.joinedAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Invite Member</h2>
              <button
                onClick={() => {
                  setShowInvite(false);
                  setInviteEmail('');
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Enter the email address of the person you'd like to invite to your organization.
            </p>
            <form
              onSubmit={(e) => {
                void handleInvite(e);
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInvite(false);
                    setInviteEmail('');
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {inviting ? 'Sending…' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
