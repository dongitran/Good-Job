import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { OrgData } from '@/types/org';
import type { OrgSettingsMutations } from '@/hooks/useOrgSettings';

interface CompanyValuesTabProps {
  org: OrgData;
  settingsMutations: OrgSettingsMutations;
}

interface ValueFormState {
  name: string;
  emoji: string;
  description: string;
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const EMPTY_FORM: ValueFormState = {
  name: '',
  emoji: '',
  description: '',
};

export default function CompanyValuesTab({ org, settingsMutations }: CompanyValuesTabProps) {
  const values = useMemo(
    () =>
      [...(org.coreValues ?? [])]
        .filter((value) => value.isActive)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [org.coreValues],
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [form, setForm] = useState<ValueFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const isSaving =
    settingsMutations.addCoreValues.isPending ||
    settingsMutations.updateCoreValue.isPending ||
    settingsMutations.deleteCoreValue.isPending ||
    settingsMutations.reorderCoreValues.isPending;

  const openCreate = () => {
    setEditingValueId(null);
    setForm(EMPTY_FORM);
    setIsEditorOpen(true);
  };

  const openEdit = (value: { id: string; name: string; emoji?: string; description?: string }) => {
    setEditingValueId(value.id);
    setForm({
      name: value.name,
      emoji: value.emoji ?? '',
      description: value.description ?? '',
    });
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingValueId(null);
    setForm(EMPTY_FORM);
  };

  const saveValue = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingValueId) {
        await settingsMutations.updateCoreValue.mutateAsync({
          valueId: editingValueId,
          payload: {
            name: form.name.trim(),
            emoji: form.emoji.trim() || undefined,
            description: form.description.trim() || undefined,
          },
        });
        toast.success('Core value updated.');
      } else {
        await settingsMutations.addCoreValues.mutateAsync([
          {
            name: form.name.trim(),
            emoji: form.emoji.trim() || undefined,
            description: form.description.trim() || undefined,
          },
        ]);
        toast.success('Core value added.');
      }
      closeEditor();
    } catch {
      toast.error('Failed to save core value.');
    }
  };

  const disableValue = async () => {
    if (!deleteTarget) return;
    try {
      await settingsMutations.deleteCoreValue.mutateAsync(deleteTarget.id);
      toast.success('Core value disabled.');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to disable core value.');
    }
  };

  const reorderValue = async (valueId: string, direction: -1 | 1) => {
    const currentIndex = values.findIndex((value) => value.id === valueId);
    if (currentIndex < 0) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= values.length) return;

    const orderedIds = values.map((value) => value.id);
    const [moved] = orderedIds.splice(currentIndex, 1);
    if (!moved) return;
    orderedIds.splice(nextIndex, 0, moved);

    try {
      await settingsMutations.reorderCoreValues.mutateAsync(orderedIds);
      toast.success('Core values reordered.');
    } catch {
      toast.error('Failed to reorder core values.');
    }
  };

  return (
    <section className="space-y-5">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Company Values</h2>
            <p className="mt-1 text-sm text-slate-500">
              Define values that employees can tag when giving kudos
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
          >
            Add Value
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {values.map((value, index) => {
            const slug = toSlug(value.name);
            return (
              <div
                key={value.id}
                data-testid={`core-value-row-${slug}`}
                data-sort-index={index}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3"
              >
                <span className="text-2xl">{value.emoji ?? '🏷️'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{value.name}</p>
                  <p className="truncate text-xs text-slate-500">{value.description ?? '—'}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {value.usageCount ?? 0} uses
                </span>
                <button
                  type="button"
                  data-testid={`core-value-move-up-${slug}`}
                  onClick={() => void reorderValue(value.id, -1)}
                  disabled={index === 0 || isSaving}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Up
                </button>
                <button
                  type="button"
                  data-testid={`core-value-move-down-${slug}`}
                  onClick={() => void reorderValue(value.id, 1)}
                  disabled={index === values.length - 1 || isSaving}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Down
                </button>
                <button
                  type="button"
                  data-testid={`core-value-edit-${slug}`}
                  onClick={() => openEdit(value)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  data-testid={`core-value-delete-${slug}`}
                  onClick={() => setDeleteTarget({ id: value.id, name: value.name })}
                  className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100"
                >
                  Disable
                </button>
              </div>
            );
          })}
        </div>
      </article>

      {isEditorOpen && (
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">
            {editingValueId ? 'Edit Value' : 'Add New Value'}
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label
                htmlFor="core-value-name"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Value Name
              </label>
              <input
                id="core-value-name"
                aria-label="Value Name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label
                htmlFor="core-value-emoji"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Emoji
              </label>
              <input
                id="core-value-emoji"
                aria-label="Emoji"
                value={form.emoji}
                onChange={(e) => setForm((prev) => ({ ...prev, emoji: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="core-value-description"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Description
            </label>
            <textarea
              id="core-value-description"
              aria-label="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveValue()}
              disabled={!form.name.trim() || isSaving}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              Save Value
            </button>
          </div>
        </article>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Disable Value</h3>
            <p className="mt-2 text-sm text-slate-500">
              Disable <strong>{deleteTarget.name}</strong>? Existing kudos keep their history.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void disableValue()}
                disabled={isSaving}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Disable Value
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
