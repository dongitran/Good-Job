import { useState } from 'react';
import { ImagePlus, Info } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';

interface OrgData {
  name: string;
  industry: string;
  companySize: string;
  logoPreview: string | null;
}

interface OrganizationStepProps {
  data: OrgData;
  onChange: (data: OrgData) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const INDUSTRIES = [
  { value: '', label: 'Select industry...' },
  { value: 'tech', label: 'Technology' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'agency', label: 'Agency' },
  { value: 'finance', label: 'Finance' },
  { value: 'other', label: 'Other' },
];

const COMPANY_SIZES = [
  { value: '', label: 'Select size...' },
  { value: '1-10', label: '1-10 people' },
  { value: '11-50', label: '11-50 people' },
  { value: '51-200', label: '51-200 people' },
  { value: '201-500', label: '201-500 people' },
  { value: '500+', label: '500+ people' },
];

export default function OrganizationStep({
  data,
  onChange,
  onContinue,
  onBack,
  onSkip,
  isSubmitting,
}: OrganizationStepProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return; // 2MB max
    const url = URL.createObjectURL(file);
    onChange({ ...data, logoPreview: url });
  };

  return (
    <OnboardingLayout
      currentStep={2}
      onContinue={onContinue}
      onBack={onBack}
      onSkip={onSkip}
      continueDisabled={!data.name.trim() || isSubmitting}
      continueLabel={isSubmitting ? 'Saving...' : 'Continue'}
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Create Your Organization</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tell us about your company so we can customize your experience.
        </p>

        <div className="mt-6 space-y-4">
          {/* Organization Name */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-600">
              Organization Name <span className="text-rose-500">*</span>
            </span>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              placeholder="e.g. Amanotes"
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white"
            />
          </label>

          {/* Industry + Company Size */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-600">Industry</span>
              <select
                value={data.industry}
                onChange={(e) => onChange({ ...data, industry: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white"
              >
                {INDUSTRIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-600">
                Company Size
              </span>
              <select
                value={data.companySize}
                onChange={(e) => onChange({ ...data, companySize: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white"
              >
                {COMPANY_SIZES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Logo Upload */}
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-600">
              Organization Logo <span className="text-slate-400">(optional)</span>
            </span>
            <div
              className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${
                dragOver
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-slate-300 bg-slate-50 hover:border-slate-400'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleLogoFile(file);
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/png,image/jpeg';
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (file) handleLogoFile(file);
                };
                input.click();
              }}
            >
              {data.logoPreview ? (
                <img
                  src={data.logoPreview}
                  alt="Logo preview"
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <>
                  <ImagePlus className="mb-2 h-6 w-6 text-slate-400" />
                  <p className="text-sm text-slate-500">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-400">PNG, JPG up to 2MB</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          Your progress is saved automatically
        </div>
      </div>
    </OnboardingLayout>
  );
}
