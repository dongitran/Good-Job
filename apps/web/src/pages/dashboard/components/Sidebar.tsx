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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onGiveKudos: () => void;
  user: { fullName: string; email: string } | null;
  orgName?: string;
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Rewards', icon: Gift, path: '/rewards' },
  { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
  { label: 'Profile', icon: User, path: '/profile' },
  { label: 'Settings', icon: Settings, path: '/settings' },
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

  return (
    <aside className="flex w-[128px] flex-shrink-0 flex-col bg-white border-r border-slate-100">
      {/* Logo */}
      <div className="flex flex-col items-center px-3 pt-5 pb-4">
        <div className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-500 text-white">
            <Star className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-sm text-slate-900 leading-none">Good Job</span>
        </div>
        {orgName && (
          <span className="mt-1 text-[10px] text-slate-400 text-center leading-tight truncate w-full px-1">
            {orgName}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-medium transition',
                active
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}

        {/* Admin with PRO badge */}
        <button
          type="button"
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition relative"
        >
          <ShieldCheck className="h-4 w-4" />
          Admin
          <span className="absolute top-1.5 right-1.5 rounded-full bg-violet-500 px-1 py-px text-[8px] font-bold text-white leading-none">
            PRO
          </span>
        </button>
      </nav>

      {/* Give Kudos button */}
      <div className="px-2 pb-3">
        <button
          type="button"
          onClick={onGiveKudos}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-2.5 text-xs font-semibold text-white transition hover:brightness-105"
        >
          <Plus className="h-3.5 w-3.5" />
          Give Kudos
        </button>
      </div>

      {/* User footer */}
      <div className="flex items-center gap-2 border-t border-slate-100 px-2 py-3">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
          {user ? getInitials(user.fullName) : '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-slate-700 leading-tight">
            {user?.fullName ?? ''}
          </p>
          <p className="truncate text-[9px] text-slate-400 leading-tight">{user?.email ?? ''}</p>
        </div>
        <Settings className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
      </div>
    </aside>
  );
}
