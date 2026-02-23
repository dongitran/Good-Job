import OnboardingLayout from '../OnboardingLayout';
import { cn } from '@/lib/utils';

export interface BudgetData {
  monthlyGivingBudget: number;
  minPerKudo: number;
  maxPerKudo: number;
}

interface PointsBudgetStepProps {
  budgetData: BudgetData;
  onChange: (data: BudgetData) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const PRESETS = [100, 200, 500, 1000];

export default function PointsBudgetStep({
  budgetData,
  onChange,
  onContinue,
  onBack,
  onSkip,
  isSubmitting,
}: PointsBudgetStepProps) {
  const { monthlyGivingBudget, minPerKudo, maxPerKudo } = budgetData;

  const setField = (field: keyof BudgetData, value: number) => {
    onChange({ ...budgetData, [field]: value });
  };

  return (
    <OnboardingLayout
      currentStep={4}
      onContinue={onContinue}
      onBack={onBack}
      onSkip={onSkip}
      continueDisabled={isSubmitting}
      continueLabel={isSubmitting ? 'Saving...' : 'Continue'}
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Points & Budget</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure how many points each member can give per month and the range per recognition.
        </p>

        <div className="mt-5 space-y-5">
          {/* Monthly Budget */}
          <div>
            <label htmlFor="monthlyBudget" className="block text-sm font-semibold text-slate-700">
              Monthly Giving Budget
            </label>
            <p className="mt-0.5 text-xs text-slate-400">
              Points each member receives to give out every month
            </p>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="monthlyBudget"
                type="number"
                min={10}
                max={10000}
                value={monthlyGivingBudget}
                onChange={(e) => setField('monthlyGivingBudget', Number(e.target.value) || 0)}
                className="w-32 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <span className="text-sm text-slate-500">points / member / month</span>
            </div>
            <div className="mt-2 flex gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setField('monthlyGivingBudget', preset)}
                  className={cn(
                    'rounded-lg px-3 py-1 text-xs font-medium transition',
                    monthlyGivingBudget === preset
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Points Range */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Points per Recognition
            </label>
            <p className="mt-0.5 text-xs text-slate-400">
              Min and max points a member can give in a single kudos
            </p>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="minPerKudo" className="mb-1 block text-xs text-slate-500">
                  Minimum
                </label>
                <input
                  id="minPerKudo"
                  type="number"
                  min={1}
                  max={100}
                  value={minPerKudo}
                  onChange={(e) => setField('minPerKudo', Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label htmlFor="maxPerKudo" className="mb-1 block text-xs text-slate-500">
                  Maximum
                </label>
                <input
                  id="maxPerKudo"
                  type="number"
                  min={1}
                  max={1000}
                  value={maxPerKudo}
                  onChange={(e) => setField('maxPerKudo', Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                <span className="text-sm">💡</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Preview</p>
                <p className="mt-1 text-xs text-slate-500">
                  Each member gets{' '}
                  <strong className="text-violet-600">{monthlyGivingBudget} points/month</strong>{' '}
                  and can give{' '}
                  <strong className="text-violet-600">
                    {minPerKudo}–{maxPerKudo} points
                  </strong>{' '}
                  per recognition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
