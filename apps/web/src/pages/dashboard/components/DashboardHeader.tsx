import { Bell, Gift, Star } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface DashboardHeaderProps {
  balance?: { giveableBalance: number; redeemableBalance: number };
  user: { fullName: string } | null;
}

export default function DashboardHeader({ balance, user }: DashboardHeaderProps) {
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

        {/* Bell notification */}
        <div className="relative">
          <Bell className="h-5 w-5 text-slate-500" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white leading-none">
            1
          </span>
        </div>

        {/* User avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
          {user ? getInitials(user.fullName) : '?'}
        </div>
      </div>
    </header>
  );
}
