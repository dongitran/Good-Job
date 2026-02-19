import { ClipboardList, Heart, Users } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';

interface WelcomeStepProps {
  onContinue: () => void;
}

export default function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <OnboardingLayout
      currentStep={1}
      onContinue={onContinue}
      continueLabel="Get Started"
      showBack={false}
      showSkip={false}
    >
      <div className="text-center">
        <div className="mx-auto mb-4 text-5xl">🎉</div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Welcome to Good Job!</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
          Let&apos;s set up your workspace in just a few minutes. Your team will be recognizing
          great work in no time!
        </p>

        <div className="mt-8 flex justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <ClipboardList className="h-5 w-5 text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Set up org</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Heart className="h-5 w-5 text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Pick values</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Invite team</span>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400">⏱ Takes about 2 minutes</p>
      </div>
    </OnboardingLayout>
  );
}
