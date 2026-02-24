import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { OrgData } from '@/types/org';
import type { OrgSettingsMutations } from '@/hooks/useOrgSettings';

interface NotificationsTabProps {
  org: OrgData;
  settingsMutations: OrgSettingsMutations;
}

type NotificationKey = 'emailDigest' | 'pushNotifications' | 'slackPosts' | 'monthlyLeaderboard';

const NOTIFICATION_ITEMS: Array<{
  key: NotificationKey;
  emoji: string;
  label: string;
  description: string;
}> = [
  {
    key: 'emailDigest',
    emoji: '📧',
    label: 'Email Digest',
    description: 'Weekly summary of recognition activity',
  },
  {
    key: 'pushNotifications',
    emoji: '🔔',
    label: 'Push Notifications',
    description: 'Real-time kudos notifications',
  },
  {
    key: 'slackPosts',
    emoji: '💬',
    label: 'Slack Integration',
    description: 'Post kudos to #recognition channel',
  },
  {
    key: 'monthlyLeaderboard',
    emoji: '🏆',
    label: 'Monthly Leaderboard Announcement',
    description: 'Auto-announce top recognizers each month',
  },
];

export default function NotificationsTab({ org, settingsMutations }: NotificationsTabProps) {
  const defaults = useMemo(
    () => ({
      emailDigest: org.settings?.notifications?.emailDigest ?? true,
      pushNotifications: org.settings?.notifications?.pushNotifications ?? true,
      slackPosts: org.settings?.notifications?.slackPosts ?? true,
      monthlyLeaderboard: org.settings?.notifications?.monthlyLeaderboard ?? false,
    }),
    [org],
  );
  const [draft, setDraft] = useState<Partial<typeof defaults>>({});

  const values = {
    emailDigest: draft.emailDigest ?? defaults.emailDigest,
    pushNotifications: draft.pushNotifications ?? defaults.pushNotifications,
    slackPosts: draft.slackPosts ?? defaults.slackPosts,
    monthlyLeaderboard: draft.monthlyLeaderboard ?? defaults.monthlyLeaderboard,
  };

  const isSaving = settingsMutations.updateOrg.isPending;

  const toggle = (key: NotificationKey) => {
    setDraft((prev) => ({
      ...prev,
      [key]: !values[key],
    }));
  };

  const handleSave = async () => {
    try {
      await settingsMutations.updateOrg.mutateAsync({
        settings: {
          notifications: {
            emailDigest: values.emailDigest,
            pushNotifications: values.pushNotifications,
            slackPosts: values.slackPosts,
            monthlyLeaderboard: values.monthlyLeaderboard,
          },
        },
      });
      setDraft({});
      toast.success('Notification defaults saved.');
    } catch {
      toast.error('Failed to save notification defaults.');
    }
  };

  return (
    <section className="space-y-6">
      <article className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Notification Defaults</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Default notification settings for all org members
          </p>
        </div>
        <div className="space-y-3 p-6">
          {NOTIFICATION_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="switch"
              aria-label={item.label}
              aria-checked={values[item.key]}
              onClick={() => toggle(item.key)}
              className="flex w-full items-center justify-between rounded-xl bg-slate-50/80 p-3 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition',
                  values[item.key] ? 'bg-violet-600' : 'bg-slate-300',
                )}
              >
                <span
                  className={cn(
                    'h-4 w-4 rounded-full bg-white shadow-sm transition',
                    values[item.key] ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </span>
            </button>
          ))}
        </div>
      </article>

      {/* Save Bar */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-between border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl md:-mx-6 md:px-6">
        <p className="text-xs text-slate-400">All changes are auto-saved</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDraft({})}
            className="rounded-lg bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </div>
    </section>
  );
}
