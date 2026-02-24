import type { OrgData } from '@/types/org';

interface BillingTabProps {
  org: OrgData;
}

export default function BillingTab({ org }: BillingTabProps) {
  const planLabel =
    org.plan === 'pro' ? 'Pro Plan' : org.plan === 'free' ? 'Free Plan' : 'Pro Trial';

  return (
    <section className="space-y-6">
      <article className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Billing & Plan</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Manage your subscription and payment details
          </p>
        </div>
        <div className="space-y-5 p-6">
          {/* Current Plan */}
          <div className="rounded-xl border-2 border-violet-200/50 bg-violet-50/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 text-lg text-white">
                  ⭐
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{planLabel}</p>
                  <p className="text-xs text-slate-400">$4/user/month &bull; Billed annually</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-violet-700">
                  $256<span className="text-xs font-normal text-slate-400">/mo</span>
                </p>
                <p className="text-[10px] text-slate-400">64 users &times; $4</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-violet-200/50 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-50"
              >
                Change Plan
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
              >
                View Invoice History
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4">
            <div className="flex h-8 w-12 items-center justify-center rounded bg-gradient-to-r from-blue-600 to-blue-400 text-[10px] font-bold text-white">
              VISA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">Visa ending in 4242</p>
              <p className="text-xs text-slate-400">Expires 09/2027</p>
            </div>
            <button type="button" className="text-xs font-medium text-violet-700 hover:underline">
              Update
            </button>
          </div>

          {/* Next Billing Date */}
          <div className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4">
            <div className="flex h-8 w-12 items-center justify-center rounded bg-slate-200 text-sm text-slate-500">
              📅
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">Next billing date</p>
              <p className="text-xs text-slate-400">March 1, 2026 &bull; $256.00</p>
            </div>
            <button type="button" className="text-xs font-medium text-red-500 hover:underline">
              Cancel Plan
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
            className="rounded-lg bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
          >
            Discard
          </button>
          <button
            type="button"
            className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </section>
  );
}
