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
  label: string;
  description: string;
  requiresSlack?: boolean;
}> = [
  {
    key: 'emailDigest',
    label: 'Email Digest',
    description: 'Weekly summary of recognition activity',
  },
  {
    key: 'pushNotifications',
    label: 'Push Notifications',
    description: 'Real-time kudos notifications',
  },
  {
    key: 'slackPosts',
    label: 'Slack Integration',
    description: 'Post kudos to #recognition channel',
    requiresSlack: true,
  },
  {
    key: 'monthlyLeaderboard',
    label: 'Monthly Leaderboard Announcement',
    description: 'Auto-announce top recognizers each month',
  },
];

export default function NotificationsTab({ org, settingsMutations }: NotificationsTabProps) {
  // Slack status endpoint is planned in Phase 3 (Plan #6 dependency).
  const hasSlackIntegration = false;
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
    <section className="space-y-5">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Notification Defaults</h2>
        <p className="mt-1 text-sm text-slate-500">
          Default notification settings for all organization members
        </p>

        <div className="mt-4 space-y-3">
          {NOTIFICATION_ITEMS.filter((item) => !item.requiresSlack || hasSlackIntegration).map(
            (item) => (
              <button
                key={item.key}
                type="button"
                role="switch"
                aria-label={item.label}
                aria-checked={values[item.key]}
                onClick={() => toggle(item.key)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
                <span
                  className={cn(
                    'inline-flex h-6 w-11 items-center rounded-full transition',
                    values[item.key] ? 'bg-violet-600' : 'bg-slate-300',
                  )}
                >
                  <span
                    className={cn(
                      'h-4 w-4 rounded-full bg-white transition',
                      values[item.key] ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </span>
              </button>
            ),
          )}
        </div>
      </article>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>
    </section>
  );
}
