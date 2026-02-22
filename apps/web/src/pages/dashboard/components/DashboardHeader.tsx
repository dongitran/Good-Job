import { useState, useRef, useEffect } from 'react';
import { Bell, Gift, Star, Check } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import {
  useUnreadCount,
  useNotifications,
  useMarkAllRead,
  useMarkRead,
} from '@/hooks/useNotifications';

interface DashboardHeaderProps {
  balance?: { giveableBalance: number; redeemableBalance: number };
  user: { fullName: string } | null;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardHeader({ balance, user }: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const { data: notificationsData } = useNotifications(1, 8);
  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notificationsData?.data ?? [];

  // Click-outside handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <header className="flex items-center justify-end gap-4 border-b border-slate-100 bg-white px-6 py-3">
      <div className="flex items-center gap-4 ml-auto">
        {/* Points badges */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Gift className="h-4 w-4 text-violet-500" />
            <strong className="font-bold text-slate-800">{balance?.giveableBalance ?? '—'}</strong>
            <span className="text-xs text-slate-500">to give</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="h-4 w-4 text-amber-400" />
            <strong className="font-bold text-slate-800">
              {balance?.redeemableBalance ?? '—'}
            </strong>
            <span className="text-xs text-slate-500">earned</span>
          </div>
        </div>

        {/* Bell notification with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="relative rounded-lg p-1.5 transition hover:bg-slate-100"
            data-testid="notification-bell"
          >
            <Bell className="h-5 w-5 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl z-50">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
                    data-testid="mark-all-read"
                  >
                    <Check className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm text-slate-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => {
                        if (!notif.isRead) markRead.mutate(notif.id);
                        setOpen(false);
                      }}
                      className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        !notif.isRead ? 'bg-violet-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-700 line-clamp-2">
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-violet-500" />
                        )}
                      </div>
                      {notif.body && (
                        <p className="text-xs text-slate-400 line-clamp-1">{notif.body}</p>
                      )}
                      <p className="text-[10px] text-slate-300">{formatTimeAgo(notif.createdAt)}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
          {user ? getInitials(user.fullName) : '?'}
        </div>
      </div>
    </header>
  );
}
