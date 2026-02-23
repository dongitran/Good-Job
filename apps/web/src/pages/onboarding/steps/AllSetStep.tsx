import { Check, FileText, Rocket } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';

import type { BudgetData } from './PointsBudgetStep';

type LaunchMode = 'demo' | 'fresh';

interface AllSetStepProps {
  launchMode: LaunchMode;
  onChangeLaunchMode: (mode: LaunchMode) => void;
  orgName: string;
  valuesCount: number;
  membersCount: number;
  budgetData: BudgetData;
  onBack: () => void;
  onFinish: () => void;
  isSubmitting: boolean;
}

export default function AllSetStep({
  launchMode,
  onChangeLaunchMode,
  orgName,
  valuesCount,
  membersCount,
  budgetData,
  onBack,
  onFinish,
  isSubmitting,
}: AllSetStepProps) {
  return (
    <OnboardingLayout
      currentStep={6}
      onBack={onBack}
      onContinue={onFinish}
      continueLabel={isSubmitting ? 'Launching...' : 'Launch Good Job →'}
      continueDisabled={isSubmitting}
      showSkip={false}
    >
      <div className="text-center">
        <div className="mx-auto mb-3 text-5xl">🚀</div>
        <h1 className="font-display text-3xl font-bold text-slate-900">You&apos;re All Set!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your workspace is ready. Choose how you&apos;d like to start:
        </p>
      </div>

      {/* Launch mode cards */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChangeLaunchMode('demo')}
          className={`relative rounded-xl border-2 p-4 text-left transition ${
            launchMode === 'demo'
              ? 'border-violet-500 bg-violet-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <Rocket className="mb-2 h-5 w-5 text-violet-600" />
          <p className="text-sm font-semibold text-slate-800">Explore with Demo</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Pre-loaded sample data so you can explore all features before inviting your team.
          </p>
          {launchMode === 'demo' && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-violet-600">
              <Check className="h-3.5 w-3.5" />
              Recommended
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeLaunchMode('fresh')}
          className={`relative rounded-xl border-2 p-4 text-left transition ${
            launchMode === 'fresh'
              ? 'border-violet-500 bg-violet-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <FileText className="mb-2 h-5 w-5 text-slate-600" />
          <p className="text-sm font-semibold text-slate-800">Start Fresh</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Clean workspace with no sample data. Jump straight into real recognition.
          </p>
        </button>
      </div>

      {/* Setup Summary */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Setup Summary</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Organization</span>
            <span className="font-medium text-slate-800">{orgName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Core Values</span>
            <span className="font-medium text-slate-800">{valuesCount} selected</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Monthly Budget</span>
            <span className="font-medium text-slate-800">
              {budgetData.monthlyGivingBudget} pts/member
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Team Members</span>
            <span className="font-medium text-slate-800">{membersCount} invited</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mode</span>
            <span className="font-medium text-violet-600">
              {launchMode === 'demo' ? 'Demo Mode' : 'Fresh Start'}
            </span>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
