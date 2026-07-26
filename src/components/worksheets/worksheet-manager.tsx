"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Edit05,
  File02,
  Loading01,
  Plus,
  Trash01,
} from '@untitledui/icons';
import type { BrandProfile } from '@/lib/brand-profile-types';
import type {
  Worksheet,
  WorksheetDocumentSize,
  WorksheetStatus,
} from '@/lib/worksheet-types';
import { cx } from '@/utils/cx';

const FIELD_CLASS = 'w-full border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand';

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('de-CH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function WorksheetManager() {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => worksheets.find(({ id }) => id === selectedId) ?? null,
    [selectedId, worksheets],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [worksheetResponse, brandResponse] = await Promise.all([
        fetch('/api/worksheets', { cache: 'no-store' }),
        fetch('/api/admin/brand-profiles', { cache: 'no-store' }),
      ]);
      const worksheetResult = await worksheetResponse.json() as {
        worksheets?: Worksheet[];
        error?: string;
      };
      const brandResult = await brandResponse.json() as {
        profiles?: BrandProfile[];
        error?: string;
      };
      if (!worksheetResponse.ok) throw new Error(worksheetResult.error ?? 'Could not load worksheets.');
      if (!brandResponse.ok) throw new Error(brandResult.error ?? 'Could not load brands.');
      const nextWorksheets = worksheetResult.worksheets ?? [];
      setWorksheets(nextWorksheets);
      setBrands((brandResult.profiles ?? []).filter(({ isActive }) => isActive));
      setSelectedId((current) => current ?? nextWorksheets[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load worksheets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => void load();
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [load]);

  const createWorksheet = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Worksheet' }),
      });
      const result = await response.json() as { worksheet?: Worksheet; error?: string };
      if (!response.ok || !result.worksheet) {
        throw new Error(result.error ?? 'Could not create worksheet.');
      }
      window.location.href = `/editor?worksheet=${encodeURIComponent(result.worksheet.id)}`;
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create worksheet.');
      setSaving(false);
    }
  };

  const updateWorksheet = async (patch: Partial<Worksheet>) => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, worksheet: patch }),
      });
      const result = await response.json() as { worksheet?: Worksheet; error?: string };
      if (!response.ok || !result.worksheet) {
        throw new Error(result.error ?? 'Could not update worksheet.');
      }
      setWorksheets((current) => current
        .map((worksheet) => worksheet.id === result.worksheet!.id
          ? result.worksheet!
          : worksheet)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update worksheet.');
    } finally {
      setSaving(false);
    }
  };

  const deleteWorksheet = async () => {
    if (!selected || !window.confirm(`Delete “${selected.title}”? This cannot be undone.`)) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/worksheets?id=${encodeURIComponent(selected.id)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? 'Could not delete worksheet.');
      }
      const remaining = worksheets.filter(({ id }) => id !== selected.id);
      setWorksheets(remaining);
      setSelectedId(remaining[0]?.id ?? null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete worksheet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-secondary text-primary">
      <header className="border-b border-secondary bg-primary">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <a href="/" className="flex size-9 items-center justify-center border border-primary text-quaternary hover:bg-primary_hover">
              <ArrowLeft className="size-5" />
            </a>
            <div>
              <p className="text-xs font-semibold text-brand-tertiary">Workspace</p>
              <h1 className="text-xl font-semibold">Worksheets</h1>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={createWorksheet}
            className="flex items-center gap-2 bg-brand-solid px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-brand-solid_hover disabled:opacity-50"
          >
            {saving ? <Loading01 className="size-4.5 animate-spin" /> : <Plus className="size-4.5" />}
            New worksheet
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-[360px_minmax(0,1fr)] gap-6 p-6">
        <aside className="self-start border border-secondary bg-primary p-3 shadow-xs">
          <p className="px-2 pb-3 text-sm font-semibold">Documents</p>
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-6 text-sm text-quaternary">
              <Loading01 className="size-4 animate-spin" /> Loading worksheets…
            </div>
          ) : worksheets.length ? (
            <div className="space-y-1">
              {worksheets.map((worksheet) => (
                <button
                  type="button"
                  key={worksheet.id}
                  onClick={() => setSelectedId(worksheet.id)}
                  className={cx(
                    'flex w-full items-start gap-3 px-3 py-3 text-left transition',
                    worksheet.id === selectedId ? 'bg-brand-primary' : 'hover:bg-primary_hover',
                  )}
                >
                  <File02 className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{worksheet.title}</span>
                    <span className="mt-1 block text-xs text-quaternary">
                      {worksheet.status} · {formatUpdatedAt(worksheet.updatedAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-8 text-center">
              <File02 className="mx-auto size-7 text-fg-quaternary" />
              <p className="mt-3 text-sm font-semibold">No worksheets yet</p>
              <p className="mt-1 text-xs text-quaternary">Create one to start editing.</p>
            </div>
          )}
        </aside>

        <section className="min-w-0 border border-secondary bg-primary shadow-xs">
          {selected ? (
            <>
              <div className="flex items-center justify-between border-b border-secondary px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold">{selected.title}</h2>
                  <p className="mt-1 text-xs text-quaternary">
                    Last updated {formatUpdatedAt(selected.updatedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={deleteWorksheet}
                    className="flex items-center gap-2 border border-primary px-3.5 py-2.5 text-sm font-semibold text-error-primary hover:bg-error-primary disabled:opacity-50"
                  >
                    <Trash01 className="size-4" /> Delete
                  </button>
                  <a
                    href={`/editor?worksheet=${encodeURIComponent(selected.id)}`}
                    className="flex items-center gap-2 bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-solid_hover"
                  >
                    <Edit05 className="size-4" /> Open editor
                  </a>
                </div>
              </div>

              {error && (
                <div role="alert" className="mx-6 mt-5 border border-error-primary bg-error-primary px-4 py-3 text-sm text-error-primary">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 p-6">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-tertiary" htmlFor="worksheet-title">Title</label>
                  <input
                    id="worksheet-title"
                    className={`${FIELD_CLASS} mt-2`}
                    defaultValue={selected.title}
                    key={`${selected.id}-title`}
                    onBlur={(event) => {
                      if (event.target.value.trim() !== selected.title) {
                        void updateWorksheet({ title: event.target.value });
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tertiary" htmlFor="worksheet-status">Status</label>
                  <select
                    id="worksheet-status"
                    className={`${FIELD_CLASS} mt-2`}
                    value={selected.status}
                    onChange={(event) => void updateWorksheet({
                      status: event.target.value as WorksheetStatus,
                    })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tertiary" htmlFor="worksheet-size">Document size</label>
                  <select
                    id="worksheet-size"
                    className={`${FIELD_CLASS} mt-2`}
                    value={selected.documentSize}
                    onChange={(event) => void updateWorksheet({
                      documentSize: event.target.value as WorksheetDocumentSize,
                    })}
                  >
                    <option value="a4-portrait">DIN A4 Portrait</option>
                    <option value="a4-landscape">DIN A4 Landscape</option>
                    <option value="letter-portrait">US Letter Portrait</option>
                    <option value="letter-landscape">US Letter Landscape</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-tertiary" htmlFor="worksheet-brand">Brand profile</label>
                  <select
                    id="worksheet-brand"
                    className={`${FIELD_CLASS} mt-2`}
                    value={selected.brandProfileId ?? ''}
                    onChange={(event) => void updateWorksheet({
                      brandProfileId: event.target.value || null,
                    })}
                  >
                    <option value="">No brand profile</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <File02 className="size-8 text-fg-quaternary" />
              <p className="mt-3 text-sm font-semibold">Select a worksheet</p>
              <p className="mt-1 text-xs text-quaternary">Choose a document or create a new one.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
