import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';

export interface CoreValueItem {
  name: string;
  emoji: string;
  description: string;
  selected: boolean;
}

const PRESET_VALUES: CoreValueItem[] = [
  { name: 'Teamwork', emoji: '🤝', description: 'Collaboration & support', selected: false },
  { name: 'Innovation', emoji: '💡', description: 'Creative solutions', selected: false },
  { name: 'Ownership', emoji: '🏆', description: 'Taking responsibility', selected: false },
  { name: 'Growth', emoji: '🌱', description: 'Learning & mentoring', selected: false },
  { name: 'Excellence', emoji: '⭐', description: 'Going above & beyond', selected: false },
  { name: 'Customer Focus', emoji: '🎯', description: 'Putting users first', selected: false },
];

interface CoreValuesStepProps {
  values: CoreValueItem[];
  onChange: (values: CoreValueItem[]) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export default function CoreValuesStep({
  values,
  onChange,
  onContinue,
  onBack,
  onSkip,
  isSubmitting,
}: CoreValuesStepProps) {
  const [customName, setCustomName] = useState('');
  const selectedCount = values.filter((v) => v.selected).length;

  const toggleValue = (index: number) => {
    const updated = values.map((v, i) => (i === index ? { ...v, selected: !v.selected } : v));
    onChange(updated);
  };

  const addCustomValue = () => {
    const name = customName.trim();
    if (!name) return;
    if (values.some((v) => v.name.toLowerCase() === name.toLowerCase())) return;
    onChange([...values, { name, emoji: '✨', description: 'Custom value', selected: true }]);
    setCustomName('');
  };

  return (
    <OnboardingLayout
      currentStep={3}
      onContinue={onContinue}
      onBack={onBack}
      onSkip={onSkip}
      continueDisabled={selectedCount < 3 || isSubmitting}
      continueLabel={isSubmitting ? 'Saving...' : 'Continue'}
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Choose Your Core Values</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select the values your team celebrates. Pick at least 3, or add your own.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {values.map((value, i) => (
            <button
              key={value.name}
              type="button"
              onClick={() => toggleValue(i)}
              className={`relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                value.selected
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {value.selected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <span className="text-xl">{value.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{value.name}</p>
                <p className="text-xs text-slate-500">{value.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Add custom value */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomValue();
              }
            }}
            placeholder="Add a custom value..."
            className="h-10 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white"
          />
          <button
            type="button"
            onClick={addCustomValue}
            disabled={!customName.trim()}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          {selectedCount} values selected <span className="text-slate-400">(minimum: 3)</span>
        </p>
      </div>
    </OnboardingLayout>
  );
}

export { PRESET_VALUES };
