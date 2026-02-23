import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Gift,
  Trophy,
  ShieldCheck,
  Star,
  Plus,
  BarChart3,
  Users,
  Tags,
  ChevronUp,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface SidebarProps {
  onGiveKudos: () => void;
  user: { fullName: string; email: string; role?: string } | null;
  orgName?: string;
  orgLogoUrl?: string | null;
  orgLoading?: boolean;
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
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function Sidebar({
  onGiveKudos,
  user,
  orgName,
  orgLogoUrl,
  orgLoading = false,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const canSeeAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const showOrgLogo = !orgLoading && Boolean(orgLogoUrl) && failedLogoUrl !== orgLogoUrl;

  return (
    <aside className="hidden w-[244px] flex-shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm overflow-hidden',
              showOrgLogo || orgLoading
                ? 'bg-slate-100'
                : 'bg-gradient-to-r from-violet-600 to-indigo-500',
            )}
          >
            {showOrgLogo ? (
              <img
                data-testid="sidebar-org-logo"
                src={orgLogoUrl!}
                alt={`${orgName ?? 'Organization'} logo`}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={() => setFailedLogoUrl(orgLogoUrl ?? null)}
              />
            ) : orgLoading ? (
              <div
                data-testid="sidebar-brand-loading"
                className="h-full w-full animate-pulse rounded-xl bg-slate-200"
              />
            ) : (
              <Star data-testid="sidebar-brand-fallback" className="h-4.5 w-4.5" />
            )}
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

      <div className="relative border-t border-slate-100" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          data-testid="account-card"
          aria-label="Account menu"
          className="flex w-full items-center gap-3 bg-slate-50/70 px-4 py-3 text-left transition hover:bg-slate-100/70"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
            {user ? getInitials(user.fullName) : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{user?.fullName ?? ''}</p>
            <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
          </div>
          <ChevronUp
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform duration-200',
              dropdownOpen ? '' : 'rotate-180',
            )}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              data-testid="account-profile"
              onClick={() => {
                navigate('/profile');
                setDropdownOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <User className="h-4 w-4" />
              My Profile
            </button>
            <button
              type="button"
              data-testid="account-settings"
              onClick={() => {
                navigate('/settings');
                setDropdownOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <div className="mx-3 my-1 border-t border-slate-100" />
            <button
              type="button"
              data-testid="account-signout"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
