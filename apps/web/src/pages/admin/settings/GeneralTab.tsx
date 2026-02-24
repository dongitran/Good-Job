import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
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
    <section className="space-y-6">
      {/* Organization Profile Card */}
      <article className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Organization Profile</h2>
          <p className="mt-0.5 text-xs text-slate-400">Basic information about your organization</p>
        </div>
        <div className="space-y-5 p-6">
          {/* Logo Upload */}
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 text-3xl text-white shadow-lg shadow-violet-200/40">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt="Organization logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>🎵</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Organization Logo</p>
              <p className="mt-0.5 text-xs text-slate-400">
                PNG, JPG up to 2MB. Recommended 256x256px.
              </p>
              <div className="mt-2 flex gap-2">
                <label
                  htmlFor="organization-logo-upload"
                  className="cursor-pointer rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100"
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
                  className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Org Name */}
          <div>
            <label htmlFor="org-name" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Organization Name
            </label>
            <input
              id="org-name"
              aria-label="Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Domain */}
          <div>
            <label
              htmlFor="org-domain"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Company Domain
            </label>
            <input
              id="org-domain"
              aria-label="Company Domain"
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              placeholder="yourcompany.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Users with this email domain will auto-join your org.
            </p>
          </div>

          {/* Timezone & Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="org-timezone"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Timezone
              </label>
              <select
                id="org-timezone"
                aria-label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
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
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Language
              </label>
              <select
                id="org-language"
                aria-label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
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

      {/* Danger Zone */}
      <article className="overflow-hidden rounded-2xl border border-red-200/60 bg-white shadow-sm">
        <div className="border-b border-red-100 bg-red-50/30 px-6 py-4">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-red-600">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h2>
          <p className="mt-0.5 text-xs text-red-400">Irreversible actions — proceed with caution</p>
        </div>
        <div className="space-y-3 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Export All Data</p>
              <p className="text-xs text-slate-400">Download all organization data as CSV</p>
            </div>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={isExporting}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>

          <hr className="border-slate-100" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Delete Organization</p>
              <p className="text-xs text-slate-400">Permanently delete this org and all its data</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-100"
            >
              Delete Org
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
            onClick={() => void handleSave()}
            disabled={!canSave}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Delete Modal */}
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
