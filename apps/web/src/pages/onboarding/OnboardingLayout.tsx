import { type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import StepIndicator from './StepIndicator';

interface OnboardingLayoutProps {
  currentStep: number;
  children: ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
  showSkip?: boolean;
}

export default function OnboardingLayout({
  currentStep,
  children,
  onBack,
  onSkip,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  showBack = true,
  showSkip = true,
}: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 p-4">
      <div className="w-full max-w-[600px] rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-500 text-white">
              <Star className="h-4 w-4" />
            </div>
            <span className="font-display text-xl font-bold text-slate-900">Good Job</span>
          </div>
          <span className="text-sm font-medium text-slate-500">Step {currentStep} of 5</span>
        </div>

        {/* Step Indicator */}
        <div className="px-8 pt-4 pb-2">
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* Content */}
        <div className="px-8 py-6">{children}</div>

        {/* Footer Navigation */}
        {(showBack || showSkip || onContinue) && (
          <div className="flex items-center justify-between border-t border-slate-100 px-8 py-4">
            <div>
              {showBack && currentStep > 1 && onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {showSkip && onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-sm font-medium text-slate-400 hover:text-slate-600"
                >
                  Skip
                </button>
              )}
              {onContinue && (
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={continueDisabled}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
                >
                  {continueLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
