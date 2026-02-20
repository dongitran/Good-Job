import { cn, formatPoints, formatRelativeTime } from '@/lib/utils';
import type { FeedItem as FeedItemType } from '@/hooks/useFeed';

interface FeedItemProps {
  item: FeedItemType;
}

function Avatar({
  user,
  size = 'md',
}: {
  user: { fullName: string; avatarUrl?: string | null };
  size?: 'sm' | 'md';
}) {
  const initials = user.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        className={cn('rounded-full object-cover flex-shrink-0', sizeClass)}
      />
    );
  }

  // Generate a consistent color from the name
  const colors = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-indigo-100 text-indigo-700',
  ];
  const colorIdx =
    user.fullName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-full font-bold',
        sizeClass,
        colors[colorIdx],
      )}
    >
      {initials}
    </div>
  );
}

export default function FeedItem({ item }: FeedItemProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      {/* Header: giver → receiver + points + time */}
      <div className="flex items-center gap-2 flex-wrap">
        <Avatar user={item.giver} />
        <span className="text-sm font-semibold text-slate-800">{item.giver.fullName}</span>
        <span className="text-slate-400 text-sm">→</span>
        <Avatar user={item.receiver} />
        <span className="text-sm font-semibold text-slate-800">{item.receiver.fullName}</span>
        <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
          +{formatPoints(item.points)}
        </span>
        <span className="ml-auto text-xs text-slate-400 flex-shrink-0">
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>

      {/* Message */}
      <p className="mt-2 text-sm italic text-slate-700 leading-relaxed">"{item.message}"</p>

      {/* Tags */}
      {item.coreValue && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
            {item.coreValue.emoji} #{item.coreValue.name}
          </span>
        </div>
      )}

      {/* Reactions */}
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
        <button type="button" className="flex items-center gap-1 transition hover:text-slate-600">
          🤝 {item.reactionCount}
        </button>
        <button type="button" className="flex items-center gap-1 transition hover:text-slate-600">
          🗣 0
        </button>
        <button type="button" className="flex items-center gap-1 transition hover:text-slate-600">
          ❤️ 0
        </button>
        <button type="button" className="flex items-center gap-1 transition hover:text-slate-600">
          💬 {item.commentCount}
        </button>
        <button
          type="button"
          className="ml-auto text-violet-500 font-medium transition hover:text-violet-700"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
