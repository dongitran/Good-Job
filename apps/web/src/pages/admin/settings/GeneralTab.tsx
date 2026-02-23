import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { OrgData } from '@/types/org';
import type { OrgSettingsMutations } from '@/hooks/useOrgSettings';

interface GeneralTabProps {
  org: OrgData;
  settingsMutations: OrgSettingsMutations;
}

const DEFAULT_TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+7)' },
  { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
];

const DEFAULT_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'ja', label: 'Japanese' },
];

export default function GeneralTab({ org, settingsMutations }: GeneralTabProps) {
  const [name, setName] = useState(org.name);
  const [companyDomain, setCompanyDomain] = useState(org.companyDomain ?? '');
  const [timezone, setTimezone] = useState(org.timezone ?? 'Asia/Ho_Chi_Minh');
  const [language, setLanguage] = useState(org.language ?? 'en');
  const [uploading, setUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    setName(org.name);
    setCompanyDomain(org.companyDomain ?? '');
    setTimezone(org.timezone ?? 'Asia/Ho_Chi_Minh');
    setLanguage(org.language ?? 'en');
  }, [org]);

  const isSaving = settingsMutations.updateOrg.isPending || uploading;
  const isExporting = settingsMutations.exportData.isPending;
  const canSave = useMemo(() => name.trim().length > 0 && !isSaving, [name, isSaving]);
  const canConfirmDelete = deleteConfirmText.trim() === org.name.trim();

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await settingsMutations.updateOrg.mutateAsync({
        name: name.trim(),
        companyDomain: companyDomain.trim() || undefined,
        timezone,
        language,
      });
      toast.success('Organization profile saved.');
    } catch {
      toast.error('Failed to save organization profile.');
    }
  };

  const handleUploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const logoUrl = await settingsMutations.uploadLogo.mutateAsync(file);
      await settingsMutations.updateOrg.mutateAsync({ logoUrl });
      toast.success('Logo updated.');
    } catch {
      toast.error('Failed to upload logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!org.logoUrl || isSaving) return;
    setUploading(true);
    try {
      await settingsMutations.updateOrg.mutateAsync({ logoUrl: null });
      toast.success('Logo removed.');
    } catch {
      toast.error('Failed to remove logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      const result = await settingsMutations.exportData.mutateAsync();
      const blob = new Blob([result.csv], { type: result.contentType });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success('Export created.');
    } catch {
      toast.error('Failed to export organization data.');
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteConfirmText('');
  };

  const handleDeleteOrg = () => {
    if (!canConfirmDelete) return;
    toast.info('Delete organization API will be implemented in a later phase.');
    closeDeleteModal();
  };

  return (
    <section className="space-y-5">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Organization Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Basic information about your organization</p>

        <div className="mt-5 flex flex-wrap items-start gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-violet-100 text-2xl font-bold text-violet-700">
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt="Organization logo"
                className="h-full w-full object-cover"
              />
            ) : (
              '🏢'
            )}
          </div>
          <div>
            <label
              htmlFor="organization-logo-upload"
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Upload New
            </label>
            <input
              id="organization-logo-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleUploadLogo(file);
                }
              }}
            />
            <button
              type="button"
              onClick={() => void handleRemoveLogo()}
              disabled={!org.logoUrl || isSaving}
              className="ml-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Remove
            </button>
            <p className="mt-2 text-xs text-slate-400">PNG/JPG up to 2MB. Recommended 256x256px.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="org-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Organization Name
            </label>
            <input
              id="org-name"
              aria-label="Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label
              htmlFor="org-domain"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Company Domain
            </label>
            <input
              id="org-domain"
              aria-label="Company Domain"
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              placeholder="yourcompany.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Users with this email domain will auto-join your org.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="org-timezone"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Timezone
              </label>
              <select
                id="org-timezone"
                aria-label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                {DEFAULT_TIMEZONES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="org-language"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Language
              </label>
              <select
                id="org-language"
                aria-label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                {DEFAULT_LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-rose-200 bg-rose-50/30 p-6">
        <h2 className="text-lg font-bold text-rose-700">Danger Zone</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Export All Data</p>
            <p className="text-xs text-slate-500">Download all organization data as CSV</p>
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isExporting}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Delete Organization</p>
            <p className="text-xs text-slate-500">
              Permanently remove this workspace and all associated data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
          >
            Delete Organization
          </button>
        </div>
      </article>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!canSave}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete organization"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-900">Delete organization</h3>
            <p className="mt-2 text-sm text-slate-600">
              This action is irreversible. Type your organization name to enable deletion.
            </p>

            <div className="mt-4">
              <label
                htmlFor="delete-org-confirm"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Type organization name to confirm
              </label>
              <input
                id="delete-org-confirm"
                aria-label="Type organization name to confirm"
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrg}
                disabled={!canConfirmDelete}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Delete Org
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
