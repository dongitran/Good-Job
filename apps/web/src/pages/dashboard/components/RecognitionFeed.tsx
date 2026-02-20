import { cn } from '@/lib/utils';
import { useFeed } from '@/hooks/useFeed';
import FeedItem from './FeedItem';

interface CoreValue {
  id: string;
  name: string;
  emoji?: string;
  isActive: boolean;
}

interface RecognitionFeedProps {
  orgId: string;
  coreValues?: CoreValue[];
  activeValueId?: string;
  onValueChange: (id: string | undefined) => void;
}

export default function RecognitionFeed({
  orgId,
  coreValues = [],
  activeValueId,
  onValueChange,
}: RecognitionFeedProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeed(
    orgId,
    activeValueId,
  );

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  const tabs = [
    { id: undefined, label: 'All Values' },
    ...coreValues
      .filter((v) => v.isActive)
      .map((v) => ({ id: v.id, label: `${v.emoji ?? ''} #${v.name}` })),
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">Recognition Feed</h3>
        <p className="text-sm text-slate-500">Celebrate wins across the team 🎉</p>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={String(tab.id ?? 'all')}
            type="button"
            onClick={() => onValueChange(tab.id)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition',
              activeValueId === tab.id
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed list */}
      <div className="space-y-3">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
              />
            ))}
          </>
        )}

        {!isLoading && allItems.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <p className="text-slate-500">No kudos yet. Be the first to recognize someone! 🎉</p>
          </div>
        )}

        {allItems.map((item) => (
          <FeedItem key={item.id} item={item} />
        ))}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-600 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more ↓'}
          </button>
        </div>
      )}
    </div>
  );
}
