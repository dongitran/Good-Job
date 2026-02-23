import type { OrgData } from '@/types/org';

interface BillingTabProps {
  org: OrgData;
}

export default function BillingTab({ org }: BillingTabProps) {
  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Billing & Plan</h2>
        <p className="mt-1 text-sm text-slate-500">Phase 4 placeholder with current org plan.</p>
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
          <p className="text-sm font-semibold text-slate-800">
            Current plan:{' '}
            <span className="capitalize text-violet-700">{org.plan ?? 'pro_trial'}</span>
          </p>
        </div>
      </article>
    </section>
  );
}
