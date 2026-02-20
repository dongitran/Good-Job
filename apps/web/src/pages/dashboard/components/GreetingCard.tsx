import { Gift, ShoppingBag } from 'lucide-react';

interface GreetingCardProps {
  giveableBalance: number;
  user: { fullName: string } | null;
  onGiveKudos: () => void;
  onBrowseRewards?: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function GreetingCard({
  giveableBalance,
  user,
  onGiveKudos,
  onBrowseRewards,
}: GreetingCardProps) {
  const greeting = getGreeting();
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  return (
    <div className="rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-orange-400 p-6 text-white shadow-sm">
      <h2 className="text-2xl font-bold">
        {greeting}, {firstName}! 👋
      </h2>
      <p className="mt-1 text-sm text-white/90">
        You have <strong className="font-bold text-white">{giveableBalance} points</strong> left to
        give this month. Spread the love! ✨
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onGiveKudos}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-50"
        >
          <Gift className="h-4 w-4" />
          Give Kudos
        </button>
        <button
          type="button"
          onClick={onBrowseRewards}
          className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <ShoppingBag className="h-4 w-4" />
          Browse Rewards
        </button>
      </div>
    </div>
  );
}
