import { useState, type KeyboardEvent } from 'react';
import { AlertTriangle, Paperclip, X } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';

interface InviteTeamStepProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InviteTeamStep({
  emails,
  onChange,
  onContinue,
  onBack,
  onSkip,
  isSubmitting,
}: InviteTeamStepProps) {
  const [input, setInput] = useState('');

  const addEmail = (raw: string) => {
    const email = raw.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) return;
    if (emails.includes(email)) return;
    onChange([...emails, email]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(input);
      setInput('');
    }
    if (e.key === 'Backspace' && !input && emails.length > 0) {
      onChange(emails.slice(0, -1));
    }
  };

  const removeEmail = (email: string) => {
    onChange(emails.filter((e) => e !== email));
  };

  const handleCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split(/[\r\n,]+/);
      const newEmails = new Set(emails);
      for (const line of lines) {
        const email = line.trim().toLowerCase();
        if (EMAIL_RE.test(email)) newEmails.add(email);
      }
      onChange([...newEmails]);
    };
    reader.readAsText(file);
  };

  return (
    <OnboardingLayout
      currentStep={4}
      onContinue={onContinue}
      onBack={onBack}
      onSkip={onSkip}
      continueDisabled={isSubmitting}
      continueLabel={isSubmitting ? 'Sending...' : 'Continue'}
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Invite Your Team</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add teammates by email. You can always invite more people later.
        </p>

        {/* Email tag input */}
        <div className="mt-5">
          <span className="mb-1.5 block text-sm font-semibold text-slate-600">Email Addresses</span>
          <div className="flex min-h-[48px] flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 transition focus-within:border-violet-400 focus-within:bg-white">
            {emails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2.5 py-1 text-sm text-violet-700"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-violet-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              type="email"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (input.trim()) {
                  addEmail(input);
                  setInput('');
                }
              }}
              placeholder={emails.length === 0 ? 'Enter email and press Enter...' : ''}
              className="min-w-[200px] flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          {emails.length > 0 && (
            <p className="mt-1.5 text-sm text-slate-500">
              {emails.length} teammate{emails.length !== 1 ? 's' : ''} invited
            </p>
          )}
        </div>

        {/* Bulk Import */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2">
            <p className="text-sm font-semibold text-slate-700">Bulk Import</p>
            <p className="text-xs text-slate-500">Upload a CSV file with email addresses</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv,text/csv';
              input.onchange = () => {
                const file = input.files?.[0];
                if (file) handleCSV(file);
              };
              input.click();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Paperclip className="h-4 w-4" />
            Choose CSV File
          </button>
        </div>

        {/* Admin info */}
        <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">You&apos;ll be the Admin</p>
            <p className="text-xs text-amber-700">
              You can assign admin roles to others after setup.
            </p>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
