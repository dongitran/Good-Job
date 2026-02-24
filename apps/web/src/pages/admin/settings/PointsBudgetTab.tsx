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
      minPerKudo: org.settings?.points?.minPerKudo ?? 1,
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
  const minPerKudo = draft.minPerKudo ?? defaults.minPerKudo;
  const pointValue = draft.pointValue ?? defaults.pointValue;
  const maxPerKudo = draft.maxPerKudo ?? defaults.maxPerKudo;
  const resetDay = draft.resetDay ?? defaults.resetDay;
  const allowRollover = draft.allowRollover ?? defaults.allowRollover;
  const managerBonusEnabled = draft.managerBonusEnabled ?? defaults.managerBonusEnabled;
  const managerBonusAmount = draft.managerBonusAmount ?? defaults.managerBonusAmount;

  const isSaving = settingsMutations.updateOrg.isPending;
  const isValid = useMemo(
    () =>
      monthlyPoints > 0 &&
      minPerKudo > 0 &&
      maxPerKudo > 0 &&
      minPerKudo < maxPerKudo &&
      monthlyPoints >= maxPerKudo,
    [monthlyPoints, minPerKudo, maxPerKudo],
  );

  const handleSave = async () => {
    if (minPerKudo >= maxPerKudo) {
      toast.error('Min points per kudos must be less than max points per kudos.');
      return;
    }
    if (monthlyPoints < maxPerKudo) {
      toast.error('Monthly budget must be greater than or equal to max points per kudos.');
      return;
    }
    try {
      await settingsMutations.updateOrg.mutateAsync({
        settings: {
          points: {
            minPerKudo,
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
    <section className="space-y-6">
      <article className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Points & Budget Configuration</h2>
          <p className="mt-0.5 text-xs text-slate-400">Set monthly budgets and point values</p>
        </div>
        <div className="space-y-5 p-6">
          {/* Row 1: Monthly Points + Point Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="monthly-points"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label
                htmlFor="point-value"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Point Value (VND)
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                1 point = {pointValue.toLocaleString('en-US')} VND
              </p>
            </div>
          </div>

          {/* Row 2: Max Points per Kudos + Budget Reset Day */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="max-per-kudo"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label
                htmlFor="reset-day"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                {RESET_DAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hidden min per kudo field for API compatibility */}
          <input
            type="hidden"
            id="min-per-kudo"
            aria-label="Min Points per Kudos"
            value={minPerKudo}
          />

          {/* Toggles */}
          <div className="space-y-3">
            {/* Allow Points Rollover */}
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
              className="flex w-full items-center justify-between rounded-xl bg-slate-50/80 p-4 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">Allow Points Rollover</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Unused points carry over to next month
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition',
                  allowRollover ? 'bg-violet-600' : 'bg-slate-300',
                )}
              >
                <span
                  className={cn(
                    'h-4 w-4 rounded-full bg-white shadow-sm transition',
                    allowRollover ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </span>
            </button>

            {/* Manager Bonus Budget */}
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
              className="flex w-full items-center justify-between rounded-xl bg-slate-50/80 p-4 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">Manager Bonus Budget</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Managers get extra {managerBonusAmount} pts/month for team rewards
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition',
                  managerBonusEnabled ? 'bg-violet-600' : 'bg-slate-300',
                )}
              >
                <span
                  className={cn(
                    'h-4 w-4 rounded-full bg-white shadow-sm transition',
                    managerBonusEnabled ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </span>
            </button>
          </div>
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
            disabled={!isValid || isSaving}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </div>
    </section>
  );
}
