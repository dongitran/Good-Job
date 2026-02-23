import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { OrgData } from '@/types/org';
import type { OrgSettingsMutations } from '@/hooks/useOrgSettings';
import { cn } from '@/lib/utils';

interface PointsBudgetTabProps {
  org: OrgData;
  settingsMutations: OrgSettingsMutations;
}

const RESET_DAY_OPTIONS = [
  { value: '1', label: '1st of each month' },
  { value: '15', label: '15th of each month' },
  { value: '0', label: 'Last day of month' },
];

export default function PointsBudgetTab({ org, settingsMutations }: PointsBudgetTabProps) {
  const defaults = useMemo(
    () => ({
      monthlyPoints: org.settings?.budget?.monthlyGivingBudget ?? 200,
      pointValue: org.settings?.points?.valueInCurrency ?? 1000,
      maxPerKudo: org.settings?.points?.maxPerKudo ?? 50,
      resetDay: org.settings?.budget?.resetDay ?? 1,
      allowRollover: org.settings?.budget?.allowRollover ?? false,
      managerBonusEnabled: org.settings?.budget?.managerBonusEnabled ?? false,
      managerBonusAmount: org.settings?.budget?.managerBonusAmount ?? 100,
    }),
    [org],
  );
  const [draft, setDraft] = useState<Partial<typeof defaults>>({});

  const monthlyPoints = draft.monthlyPoints ?? defaults.monthlyPoints;
  const pointValue = draft.pointValue ?? defaults.pointValue;
  const maxPerKudo = draft.maxPerKudo ?? defaults.maxPerKudo;
  const resetDay = draft.resetDay ?? defaults.resetDay;
  const allowRollover = draft.allowRollover ?? defaults.allowRollover;
  const managerBonusEnabled = draft.managerBonusEnabled ?? defaults.managerBonusEnabled;
  const managerBonusAmount = draft.managerBonusAmount ?? defaults.managerBonusAmount;

  const isSaving = settingsMutations.updateOrg.isPending;
  const isValid = useMemo(
    () => monthlyPoints > 0 && maxPerKudo > 0 && monthlyPoints >= maxPerKudo,
    [monthlyPoints, maxPerKudo],
  );

  const handleSave = async () => {
    if (!isValid) {
      toast.error('Monthly budget must be greater than or equal to max points per kudos.');
      return;
    }
    try {
      await settingsMutations.updateOrg.mutateAsync({
        settings: {
          points: {
            maxPerKudo,
            valueInCurrency: pointValue,
            currency: 'VND',
          },
          budget: {
            monthlyGivingBudget: monthlyPoints,
            resetDay,
            allowRollover,
            managerBonusEnabled,
            managerBonusAmount: managerBonusEnabled ? managerBonusAmount : 0,
          },
        },
      });
      setDraft({});
      toast.success('Points and budget settings saved.');
    } catch {
      toast.error('Failed to save points and budget settings.');
    }
  };

  return (
    <section className="space-y-5">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Points & Budget Configuration</h2>
        <p className="mt-1 text-sm text-slate-500">Set monthly budgets and point values</p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="monthly-points"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Monthly Points per Employee
            </label>
            <input
              id="monthly-points"
              aria-label="Monthly Points per Employee"
              type="number"
              min={1}
              value={monthlyPoints}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  monthlyPoints: Number(e.target.value) || 0,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div>
            <label
              htmlFor="point-value"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Point Value
            </label>
            <input
              id="point-value"
              aria-label="Point Value"
              type="number"
              min={0}
              value={pointValue}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  pointValue: Number(e.target.value) || 0,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              1 point = {pointValue.toLocaleString('en-US')} VND
            </p>
          </div>
          <div>
            <label
              htmlFor="max-per-kudo"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Max Points per Kudos
            </label>
            <input
              id="max-per-kudo"
              aria-label="Max Points per Kudos"
              type="number"
              min={1}
              value={maxPerKudo}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  maxPerKudo: Number(e.target.value) || 0,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div>
            <label
              htmlFor="reset-day"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Budget Reset Day
            </label>
            <select
              id="reset-day"
              aria-label="Budget Reset Day"
              value={String(resetDay)}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  resetDay: Number(e.target.value),
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >
              {RESET_DAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            role="switch"
            aria-checked={allowRollover}
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                allowRollover: !allowRollover,
              }))
            }
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">Allow Points Rollover</p>
              <p className="text-xs text-slate-500">Unused points carry over to next month</p>
            </div>
            <span
              className={cn(
                'inline-flex h-6 w-11 items-center rounded-full transition',
                allowRollover ? 'bg-violet-600' : 'bg-slate-300',
              )}
            >
              <span
                className={cn(
                  'h-4 w-4 rounded-full bg-white transition',
                  allowRollover ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={managerBonusEnabled}
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                managerBonusEnabled: !managerBonusEnabled,
              }))
            }
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">Manager Bonus Budget</p>
              <p className="text-xs text-slate-500">
                Managers get extra {managerBonusAmount} pts/month for team rewards
              </p>
            </div>
            <span
              className={cn(
                'inline-flex h-6 w-11 items-center rounded-full transition',
                managerBonusEnabled ? 'bg-violet-600' : 'bg-slate-300',
              )}
            >
              <span
                className={cn(
                  'h-4 w-4 rounded-full bg-white transition',
                  managerBonusEnabled ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </span>
          </button>

          {managerBonusEnabled && (
            <div>
              <label
                htmlFor="manager-bonus-amount"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Manager Bonus Amount
              </label>
              <input
                id="manager-bonus-amount"
                type="number"
                min={0}
                value={managerBonusAmount}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    managerBonusAmount: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          )}
        </div>
      </article>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!isValid || isSaving}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>
    </section>
  );
}
