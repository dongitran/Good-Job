import { Check } from 'lucide-react';

const STEPS = ['Welcome', 'Org', 'Values', 'Budget', 'Team', 'Ready!'];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between px-2">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-violet-600 text-white'
                    : isCurrent
                      ? 'bg-violet-600 text-white'
                      : 'border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={`text-xs font-medium ${
                  isCompleted || isCurrent ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded-full ${
                  stepNum < currentStep ? 'bg-violet-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
