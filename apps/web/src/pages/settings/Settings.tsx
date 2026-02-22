import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Bell,
  Palette,
  Shield,
  ChevronRight,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import DashboardLayout from '@/components/DashboardLayout';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security';

const tabs: { key: SettingsTab; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'security', label: 'Security', icon: Shield },
];

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileSettings({ profile }: { profile: UserProfile }) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/users/me', { fullName });
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="relative">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-20 w-20 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-md">
              {getInitials(profile.fullName)}
            </div>
          )}
          <button
            type="button"
            className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-white shadow-md hover:bg-violet-700"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div>
          <p className="font-bold text-slate-800 text-lg">{profile.fullName}</p>
          <p className="text-sm text-slate-500">{profile.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-800">Personal Information</h3>

        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Full Name
          </label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Email Address
          </label>
          <input
            id="email"
            value={profile.email}
            disabled
            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>
        </div>

        <button
          type="button"
          disabled={isSaving || fullName === profile.fullName}
          onClick={() => void handleSave()}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Notification Tab ─────────────────────────────────────────────────────────

function NotificationSettings() {
  const [prefs, setPrefs] = useState({
    kudosReceived: true,
    weeklyDigest: true,
    redemptionStatus: true,
    newAnnouncements: false,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: 'kudosReceived', label: 'Kudos Received', desc: 'When someone gives you kudos' },
    { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of your recognition activity' },
    {
      key: 'redemptionStatus',
      label: 'Redemption Updates',
      desc: 'When a reward redemption status changes',
    },
    { key: 'newAnnouncements', label: 'Announcements', desc: 'Company-wide announcements' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-1">
      <h3 className="font-bold text-slate-800 mb-4">Email Notifications</h3>
      {items.map(({ key, label, desc }) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-xl px-4 py-3.5 hover:bg-slate-50 transition"
        >
          <div>
            <p className="font-semibold text-slate-700">{label}</p>
            <p className="text-xs text-slate-400">{desc}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs[key]}
            onClick={() => toggle(key)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
              prefs[key] ? 'bg-violet-600' : 'bg-slate-200',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform',
                prefs[key] ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────

function AppearanceSettings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
      <h3 className="font-bold text-slate-800">Theme</h3>
      <div className="grid grid-cols-3 gap-3">
        {(['light', 'dark', 'system'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold capitalize transition',
              theme === t
                ? 'border-violet-500 bg-violet-50 text-violet-600'
                : 'border-slate-200 text-slate-600 hover:border-slate-300',
            )}
          >
            <div
              className={cn(
                'h-10 w-full rounded-lg',
                t === 'dark'
                  ? 'bg-slate-800'
                  : t === 'light'
                    ? 'bg-slate-100'
                    : 'bg-gradient-to-r from-slate-100 to-slate-800',
              )}
            />
            {t}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">Theme customization is coming in a future release.</p>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecuritySettings() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to change password. Check your current password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-slate-400" />
        <h3 className="font-bold text-slate-800">Change Password</h3>
      </div>

      <div>
        <label
          htmlFor="currentPassword"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          Current Password
        </label>
        <div className="relative">
          <input
            id="currentPassword"
            type={showCurrent ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-semibold text-slate-700">
          New Password
        </label>
        <div className="relative">
          <input
            id="newPassword"
            type={showNew ? 'text' : 'password'}
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      <button
        type="button"
        disabled={isSaving || !form.currentPassword || !form.newPassword}
        onClick={() => void handleChangePassword()}
        className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        <Lock className="h-4 w-4" />
        {isSaving ? 'Updating…' : 'Update Password'}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['users', 'me'],
    queryFn: () => api.get('/users/me').then((r) => r.data as UserProfile),
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <section>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Settings</h1>
          <p className="mt-1 text-lg text-slate-500">
            Manage your profile, preferences, and account security
          </p>
        </section>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <nav className="w-52 flex-shrink-0 space-y-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition',
                  activeTab === key
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4.5 w-4.5" />
                  {label}
                </div>
                <ChevronRight className="h-4 w-4 opacity-40" />
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && profile && <ProfileSettings profile={profile} />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'appearance' && <AppearanceSettings />}
            {activeTab === 'security' && <SecuritySettings />}

            {activeTab === 'profile' && !profile && (
              <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
