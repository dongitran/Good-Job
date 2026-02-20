import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Package,
  CheckCircle2,
  Flame,
  DollarSign,
  X,
  Edit3,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, formatPoints, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { usePointBalance } from '@/hooks/usePointBalance';
import Sidebar from '@/pages/dashboard/components/Sidebar';
import DashboardHeader from '@/pages/dashboard/components/DashboardHeader';
import GiveKudosModal from '@/pages/dashboard/components/GiveKudosModal';
import {
  AdminRewardItem,
  CreateRewardPayload,
  useAdminRewards,
  useAdminRewardStats,
  useAdminRedemptions,
  useCreateReward,
  useUpdateReward,
  useDisableReward,
  useEnableReward,
  useRestockReward,
  useDeleteReward,
  useUpdateRedemptionStatus,
} from '@/hooks/useAdminRewards';

interface OrgData {
  id: string;
  name: string;
  coreValues?: { id: string; name: string; emoji?: string; isActive: boolean }[];
}

const CATEGORIES = [
  { key: 'all', label: 'All Categories' },
  { key: 'swag', label: '👕 Swag' },
  { key: 'gift_card', label: '🎟️ Gift Cards' },
  { key: 'time_off', label: '🏖️ Time Off' },
  { key: 'experience', label: '🍽️ Experience' },
  { key: 'charity', label: '💝 Charity' },
] as const;

const STATUSES = [
  { key: 'all', label: 'All Status' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
] as const;

const colorByCategory: Record<string, string> = {
  swag: 'from-violet-400 to-purple-500',
  gift_card: 'from-amber-400 to-orange-500',
  time_off: 'from-sky-400 to-blue-500',
  experience: 'from-emerald-400 to-teal-500',
  charity: 'from-pink-400 to-rose-500',
};

const emojiByCategory: Record<string, string> = {
  swag: '👕',
  gift_card: '🎟️',
  time_off: '🏖️',
  experience: '🍽️',
  charity: '💝',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function stockDisplay(stock: number): { text: string; className: string } {
  if (stock === -1) return { text: 'Unlimited', className: 'bg-emerald-100 text-emerald-700' };
  if (stock === 0) return { text: 'Out of Stock', className: 'bg-rose-100 text-rose-700' };
  if (stock <= 3) return { text: `${stock} left`, className: 'bg-amber-100 text-amber-700' };
  return { text: `${stock} left`, className: 'bg-emerald-100 text-emerald-700' };
}

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    case 'approved':
      return 'bg-blue-100 text-blue-700';
    case 'fulfilled':
      return 'bg-emerald-100 text-emerald-700';
    case 'rejected':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

// ─── Add/Edit Reward Modal ────────────────────────────────────────────────────

interface RewardFormData {
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  stock: number;
}

function RewardModal({
  initial,
  onClose,
  onSave,
  isSaving,
}: {
  initial?: AdminRewardItem | null;
  onClose: () => void;
  onSave: (data: RewardFormData) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<RewardFormData>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    pointsCost: initial?.pointsCost ?? 100,
    category: initial?.category ?? 'swag',
    stock: initial?.stock ?? -1,
  });

  const set = (field: keyof RewardFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {initial ? 'Edit Reward' : 'Add New Reward'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Reward Name</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Amazon Gift Card"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the reward..."
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Points Cost
              </label>
              <input
                type="number"
                min={1}
                value={form.pointsCost}
                onChange={(e) => set('pointsCost', Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Stock <span className="text-slate-400">(-1 = unlimited)</span>
              </label>
              <input
                type="number"
                min={-1}
                value={form.stock}
                onChange={(e) => set('stock', Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >
              {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || !form.name.trim()}
            onClick={() => onSave(form)}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : initial ? 'Save Changes' : 'Create Reward'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Restock Modal ────────────────────────────────────────────────────────────

function RestockModal({
  reward,
  onClose,
  onRestock,
  isSaving,
}: {
  reward: AdminRewardItem;
  onClose: () => void;
  onRestock: (quantity: number) => void;
  isSaving: boolean;
}) {
  const [qty, setQty] = useState(10);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-xl font-bold text-slate-900">Restock "{reward.name}"</h2>
        <p className="mb-4 text-sm text-slate-500">
          Current stock: {reward.stock === -1 ? 'Unlimited' : reward.stock}
        </p>

        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Quantity to Add</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || qty < 1}
            onClick={() => onRestock(qty)}
            className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {isSaving ? 'Restocking…' : 'Restock'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminRewards() {
  const user = useAuthStore((s) => s.user);
  const { data: balance } = usePointBalance();
  const [showKudos, setShowKudos] = useState(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'redemptions'>('rewards');

  // Rewards filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('all');

  // Redemptions filters
  const [rdStatus, setRdStatus] = useState('all');
  const [rdSearch, setRdSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReward, setEditingReward] = useState<AdminRewardItem | null>(null);
  const [restockingReward, setRestockingReward] = useState<AdminRewardItem | null>(null);

  const { data: org } = useQuery<OrgData>({
    queryKey: ['org', user?.orgId],
    queryFn: () => api.get(`/organizations/${user?.orgId}`).then((r) => r.data as OrgData),
    enabled: !!user?.orgId,
  });

  const { data: stats } = useAdminRewardStats();
  const { data: rewards = [], isLoading: rewardsLoading } = useAdminRewards(
    useMemo(
      () => ({
        category: category !== 'all' ? category : undefined,
        status: status,
        search: search || undefined,
      }),
      [category, status, search],
    ),
  );
  const { data: redemptions = [], isLoading: rdLoading } = useAdminRedemptions(
    useMemo(
      () => ({
        status: rdStatus !== 'all' ? rdStatus : undefined,
        search: rdSearch || undefined,
      }),
      [rdStatus, rdSearch],
    ),
  );

  const createReward = useCreateReward();
  const updateReward = useUpdateReward();
  const disableReward = useDisableReward();
  const enableReward = useEnableReward();
  const restockReward = useRestockReward();
  const deleteReward = useDeleteReward();
  const updateRedemptionStatus = useUpdateRedemptionStatus();

  const activeCoreValues = org?.coreValues?.filter((v) => v.isActive) ?? [];
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const handleSaveReward = async (form: RewardFormData) => {
    try {
      if (editingReward) {
        await updateReward.mutateAsync({ id: editingReward.id, ...form });
        toast.success('Reward updated successfully.');
        setEditingReward(null);
      } else {
        await createReward.mutateAsync(form as CreateRewardPayload);
        toast.success('Reward created successfully.');
        setShowAddModal(false);
      }
    } catch {
      toast.error('Could not save reward. Please try again.');
    }
  };

  const handleToggle = async (reward: AdminRewardItem) => {
    try {
      if (reward.isActive) {
        await disableReward.mutateAsync(reward.id);
        toast.success('Reward disabled.');
      } else {
        await enableReward.mutateAsync(reward.id);
        toast.success('Reward enabled.');
      }
    } catch {
      toast.error('Could not update reward status.');
    }
  };

  const handleDelete = async (reward: AdminRewardItem) => {
    if (!confirm(`Delete "${reward.name}"? This cannot be undone.`)) return;
    try {
      await deleteReward.mutateAsync(reward.id);
      toast.success('Reward deleted.');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not delete reward.');
    }
  };

  const handleRestock = async (quantity: number) => {
    if (!restockingReward) return;
    try {
      await restockReward.mutateAsync({ id: restockingReward.id, quantity });
      toast.success(`Added ${quantity} units.`);
      setRestockingReward(null);
    } catch {
      toast.error('Could not restock reward.');
    }
  };

  const handleRedemptionAction = async (id: string, newStatus: string) => {
    try {
      await updateRedemptionStatus.mutateAsync({ id, status: newStatus });
      toast.success(`Redemption ${newStatus}.`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not update redemption status.');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar onGiveKudos={() => setShowKudos(true)} user={user} orgName={org?.name} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader balance={balance} user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <section>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Reward Management
              </h1>
              <p className="mt-1 text-lg text-slate-500">
                Create and manage rewards for your team to redeem
              </p>
            </section>

            {!isAdmin && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                <h2 className="text-xl font-bold text-amber-800">Admin access required</h2>
              </div>
            )}

            {isAdmin && (
              <>
                {/* Stats */}
                <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  {[
                    {
                      label: 'Total Rewards',
                      value: stats?.totalRewards ?? 0,
                      icon: Package,
                      color: 'text-violet-600',
                    },
                    {
                      label: 'Active',
                      value: stats?.activeRewards ?? 0,
                      icon: CheckCircle2,
                      color: 'text-emerald-600',
                    },
                    {
                      label: 'Redeemed (Month)',
                      value: stats?.redeemedThisMonth ?? 0,
                      icon: Flame,
                      color: 'text-orange-600',
                    },
                    {
                      label: 'Budget Spent',
                      value: formatPoints(stats?.pointsSpentThisMonth ?? 0),
                      icon: DollarSign,
                      color: 'text-blue-600',
                      raw: true,
                    },
                  ].map(({ label, value, icon: Icon, color, raw }) => (
                    <article
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-5 w-5', color)} />
                        <p className="text-sm font-medium text-slate-500">{label}</p>
                      </div>
                      <p className="mt-2 text-4xl font-extrabold text-slate-900">
                        {raw ? value : value}
                      </p>
                    </article>
                  ))}
                </section>

                {/* Tabs */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
                  {(['rewards', 'redemptions'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'rounded-lg px-5 py-2 text-sm font-semibold capitalize transition',
                        activeTab === tab ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500',
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* ── Rewards Tab ── */}
                {activeTab === 'rewards' && (
                  <>
                    {/* Filters */}
                    <section className="flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search rewards..."
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400"
                        />
                      </div>

                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'all')}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:brightness-105"
                      >
                        <Plus className="h-4 w-4" />
                        Add Reward
                      </button>
                    </section>

                    {/* Grid */}
                    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {rewardsLoading &&
                        [1, 2, 3, 4, 5, 6].map((i) => (
                          <div
                            key={i}
                            className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white"
                          />
                        ))}

                      {!rewardsLoading &&
                        rewards.map((reward) => {
                          const stock = stockDisplay(reward.stock);
                          const gradientClass =
                            colorByCategory[reward.category] ?? 'from-slate-400 to-slate-500';

                          return (
                            <article
                              key={reward.id}
                              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                            >
                              {/* Card Image */}
                              <div
                                className={cn(
                                  'relative flex h-40 items-center justify-center bg-gradient-to-br',
                                  gradientClass,
                                )}
                              >
                                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                  {emojiByCategory[reward.category] ?? '🎁'}{' '}
                                  {reward.category.replace('_', ' ')}
                                </span>
                                <span
                                  className={cn(
                                    'absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold',
                                    reward.isActive
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-100 text-slate-500',
                                  )}
                                >
                                  {reward.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="text-5xl drop-shadow">
                                  {emojiByCategory[reward.category] ?? '🎁'}
                                </span>
                              </div>

                              {/* Card Body */}
                              <div className="p-4 space-y-2">
                                <h3 className="text-lg font-bold text-slate-900 truncate">
                                  {reward.name}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
                                  {reward.description}
                                </p>

                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-extrabold text-violet-600 text-xl">
                                    {formatPoints(reward.pointsCost)} pts
                                  </span>
                                  <span className="text-slate-400">
                                    {reward.totalRedeemed} redeemed
                                  </span>
                                </div>

                                {/* Stock bar */}
                                {reward.stock > 0 && (
                                  <div className="space-y-1">
                                    <div className="h-1.5 rounded-full bg-slate-100">
                                      <div
                                        className="h-1.5 rounded-full bg-violet-400 transition-all"
                                        style={{
                                          width: `${Math.min(100, (reward.stock / Math.max(reward.stock + reward.totalRedeemed, 1)) * 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <span
                                      className={cn(
                                        'text-xs font-semibold rounded-full px-2 py-0.5',
                                        stock.className,
                                      )}
                                    >
                                      {stock.text}
                                    </span>
                                  </div>
                                )}
                                {reward.stock === -1 && (
                                  <span className="text-xs font-semibold text-emerald-600">
                                    ♾️ Unlimited stock
                                  </span>
                                )}
                                {reward.stock === 0 && (
                                  <span
                                    className={cn(
                                      'text-xs font-semibold rounded-full px-2 py-0.5',
                                      stock.className,
                                    )}
                                  >
                                    {stock.text}
                                  </span>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingReward(reward)}
                                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggle(reward)}
                                    className={cn(
                                      'flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold',
                                      reward.isActive
                                        ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
                                    )}
                                  >
                                    {reward.isActive ? 'Disable' : 'Enable'}
                                  </button>
                                  {reward.stock !== -1 && (
                                    <button
                                      type="button"
                                      onClick={() => setRestockingReward(reward)}
                                      className="flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => void handleDelete(reward)}
                                    className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}

                      {!rewardsLoading && rewards.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-400">
                          <Package className="mx-auto h-12 w-12 opacity-30" />
                          <p className="mt-3 text-lg font-medium">No rewards found</p>
                          <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                          >
                            + Add First Reward
                          </button>
                        </div>
                      )}
                    </section>
                  </>
                )}

                {/* ── Redemptions Tab ── */}
                {activeTab === 'redemptions' && (
                  <>
                    <section className="flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={rdSearch}
                          onChange={(e) => setRdSearch(e.target.value)}
                          placeholder="Search by user or reward..."
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400"
                        />
                      </div>
                      <select
                        value={rdStatus}
                        onChange={(e) => setRdStatus(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
                      >
                        {['all', 'pending', 'approved', 'fulfilled', 'rejected'].map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                            <tr>
                              <th className="px-5 py-3 font-semibold">User</th>
                              <th className="px-5 py-3 font-semibold">Reward</th>
                              <th className="px-5 py-3 font-semibold">Points</th>
                              <th className="px-5 py-3 font-semibold">Date</th>
                              <th className="px-5 py-3 font-semibold">Status</th>
                              <th className="px-5 py-3 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rdLoading && (
                              <tr>
                                <td colSpan={6} className="py-16 text-center text-slate-400">
                                  Loading redemptions…
                                </td>
                              </tr>
                            )}
                            {!rdLoading && redemptions.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-16 text-center text-slate-400">
                                  No redemptions found.
                                </td>
                              </tr>
                            )}
                            {!rdLoading &&
                              redemptions.map((rd) => (
                                <tr key={rd.id} className="hover:bg-slate-50">
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                                        {getInitials(rd.userName || 'U')}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-slate-800">
                                          {rd.userName}
                                        </p>
                                        <p className="text-xs text-slate-400">{rd.userEmail}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <p className="font-semibold text-slate-800">{rd.rewardName}</p>
                                    <p className="text-xs capitalize text-slate-400">
                                      {rd.rewardCategory.replace('_', ' ')}
                                    </p>
                                  </td>
                                  <td className="px-5 py-4 font-bold text-violet-600">
                                    {formatPoints(rd.pointsSpent)}
                                  </td>
                                  <td className="px-5 py-4 text-sm text-slate-500">
                                    {formatRelativeTime(rd.createdAt)}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span
                                      className={cn(
                                        'rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                                        statusBadge(rd.status),
                                      )}
                                    >
                                      {rd.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="flex gap-2">
                                      {rd.status === 'pending' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void handleRedemptionAction(rd.id, 'approved')
                                            }
                                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void handleRedemptionAction(rd.id, 'rejected')
                                            }
                                            className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                                          >
                                            Reject
                                          </button>
                                        </>
                                      )}
                                      {rd.status === 'approved' && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void handleRedemptionAction(rd.id, 'fulfilled')
                                          }
                                          className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                                        >
                                          Fulfill
                                        </button>
                                      )}
                                      {(rd.status === 'fulfilled' || rd.status === 'rejected') && (
                                        <span className="text-xs text-slate-400 italic">
                                          No actions
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showKudos && (
        <GiveKudosModal
          orgId={user?.orgId ?? ''}
          coreValues={activeCoreValues}
          giveableBalance={balance?.giveableBalance ?? 0}
          onClose={() => setShowKudos(false)}
        />
      )}

      {showAddModal && !editingReward && (
        <RewardModal
          onClose={() => setShowAddModal(false)}
          onSave={(form) => void handleSaveReward(form)}
          isSaving={createReward.isPending}
        />
      )}

      {editingReward && (
        <RewardModal
          initial={editingReward}
          onClose={() => setEditingReward(null)}
          onSave={(form) => void handleSaveReward(form)}
          isSaving={updateReward.isPending}
        />
      )}

      {restockingReward && (
        <RestockModal
          reward={restockingReward}
          onClose={() => setRestockingReward(null)}
          onRestock={(qty) => void handleRestock(qty)}
          isSaving={restockReward.isPending}
        />
      )}
    </div>
  );
}
