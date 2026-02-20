import { useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Gift,
  Trophy,
  User,
  Settings,
  ShieldCheck,
  Star,
  Plus,
  BarChart3,
  Users,
  Tags,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onGiveKudos: () => void;
  user: { fullName: string; email: string; role?: string } | null;
  orgName?: string;
}

const mainNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Rewards', icon: Gift, path: '/rewards' },
  { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
  { label: 'Profile', icon: User, path: '/profile' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

const adminNavItems = [
  { label: 'Analytics', icon: BarChart3, path: '/admin' },
  { label: 'Team Management', icon: Users, path: '/admin' },
  { label: 'Manage Rewards', icon: Tags, path: '/admin' },
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
                const active = location.pathname.startsWith('/admin') && label === 'Analytics';
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

      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
            {user ? getInitials(user.fullName) : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{user?.fullName ?? ''}</p>
            <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
