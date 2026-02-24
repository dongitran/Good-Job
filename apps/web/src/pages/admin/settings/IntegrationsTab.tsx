const INTEGRATIONS = [
  {
    name: 'Slack',
    description: 'Post kudos to channels & enable /kudos commands',
    iconBg: 'bg-[#4A154B]',
    iconEmoji: '💬',
    connected: true,
  },
  {
    name: 'Microsoft Teams',
    description: 'Receive notifications and send kudos from Teams',
    iconBg: 'bg-[#464EB8]',
    iconEmoji: '📱',
    connected: false,
  },
  {
    name: 'Zapier',
    description: 'Automate workflows with 5,000+ apps',
    iconBg: 'bg-[#FF4A00]',
    iconEmoji: '⚡',
    connected: false,
  },
  {
    name: 'Google Workspace',
    description: 'Sync users from Google directory',
    iconBg: 'border border-slate-200 bg-white',
    iconEmoji: '🔵',
    connected: true,
  },
];

export default function IntegrationsTab() {
  return (
    <section className="space-y-6">
      <article className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Integrations</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Connect with the tools your team already uses
          </p>
        </div>
        <div className="space-y-4 p-6">
          {INTEGRATIONS.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4"
            >
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl text-white ${integration.iconBg}`}
              >
                {integration.iconEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{integration.name}</p>
                <p className="text-xs text-slate-400">{integration.description}</p>
              </div>
              {integration.connected ? (
                <>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600">
                    Connected
                  </span>
                  <button
                    type="button"
                    className="text-xs font-medium text-violet-700 hover:underline"
                  >
                    Configure
                  </button>
                </>
              ) : (
                <>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                    Not Connected
                  </span>
                  <button
                    type="button"
                    className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Connect
                  </button>
                </>
              )}
            </div>
          ))}
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
