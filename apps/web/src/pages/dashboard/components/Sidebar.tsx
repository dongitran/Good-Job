import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Gift,
  Trophy,
  Settings,
  ShieldCheck,
  Star,
  Plus,
  BarChart3,
  Users,
  Tags,
  User,
  LogOut,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface SidebarProps {
  onGiveKudos: () => void;
  user: { fullName: string; email: string; role?: string } | null;
  orgName?: string;
}

const mainNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Rewards', icon: Gift, path: '/rewards' },
  { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
];

const adminNavItems = [
  { label: 'Analytics', icon: BarChart3, path: '/admin' },
  { label: 'Team Members', icon: Users, path: '/admin/users' },
  { label: 'Manage Rewards', icon: Tags, path: '/admin/rewards' },
];

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Sidebar({ onGiveKudos, user, orgName }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const canSeeAdmin = user?.role === 'admin' || user?.role === 'owner';
  const logout = useAuthStore((s) => s.logout);

  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  const accountMenuItems = [
    {
      label: 'My Profile',
      icon: User,
      path: '/profile',
      testId: 'account-menu-profile',
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      testId: 'account-menu-settings',
    },
  ];

  return (
    <aside className="hidden w-[244px] flex-shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-sm">
            <Star className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Good Job</p>
            <p className="text-xs text-slate-400 leading-tight truncate max-w-[150px]">
              {orgName ?? 'Amanotes'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Main
        </p>
        <div className="space-y-1">
          {mainNavItems.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                  active
                    ? 'bg-violet-50 text-violet-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </button>
            );
          })}
        </div>

        {canSeeAdmin && (
          <>
            <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Admin
            </p>
            <div className="space-y-1">
              {adminNavItems.map(({ label, icon: Icon, path }) => {
                const active =
                  path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(path);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigate(path)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                      active
                        ? 'bg-violet-50 text-violet-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{label}</span>
                    {label === 'Analytics' && (
                      <ShieldCheck className="ml-auto h-3.5 w-3.5 text-violet-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={onGiveKudos}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
        >
          <Plus className="h-4 w-4" />
          Give Kudos
        </button>
      </div>

      {/* Account card with dropdown */}
      <div className="relative border-t border-slate-100">
        {/* Dropdown menu — renders above the trigger */}
        {menuOpen && (
          <>
            {/* Backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute bottom-full left-0 right-0 z-20 mb-1 mx-2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {accountMenuItems.map(({ label, icon: Icon, path, testId }) => (
                <button
                  key={label}
                  type="button"
                  data-testid={testId}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(path);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
              <div className="mx-3 border-t border-slate-100" />
              <button
                type="button"
                data-testid="account-menu-signout"
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </>
        )}

        {/* Trigger button */}
        <button
          ref={triggerRef}
          type="button"
          data-testid="account-menu-trigger"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex w-full items-center gap-3 bg-slate-50/70 px-4 py-3 hover:bg-slate-100 transition group"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
            {user ? getInitials(user.fullName) : '?'}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-slate-800">{user?.fullName ?? ''}</p>
            <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
          </div>
          <ChevronUp
            className={cn(
              'h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200',
              menuOpen ? 'rotate-180' : 'rotate-0',
            )}
          />
        </button>
      </div>
    </aside>
  );
}
