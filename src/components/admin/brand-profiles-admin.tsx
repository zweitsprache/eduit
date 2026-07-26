"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Edit05,
  Loading01,
  Plus,
  Trash01,
} from '@untitledui/icons';
import {
  DATE_FORMATS,
  NUMBER_FORMATS,
  type BrandProfile,
  type BrandProfileInput,
} from '@/lib/brand-profile-types';
import { cx } from '@/utils/cx';

const EMPTY_PROFILE: BrandProfileInput = {
  slug: '',
  name: '',
  description: '',
  primaryColor: '#11224d',
  accentColor: '#cc6600',
  fontFamily: '"Encode Sans Semi Condensed", sans-serif',
  logoUrl: null,
  instructionNumberFormat: 'upper-alpha',
  headingNumberFormats: {
    1: 'decimal',
    2: 'decimal',
    3: 'decimal',
    4: 'decimal',
    5: 'decimal',
  },
  dateFormat: 'dd.MM.yyyy',
  isDefault: false,
  isActive: true,
};

function profileInput(profile: BrandProfile): BrandProfileInput {
  const {
    id: _id,
    isSystem: _isSystem,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...input
  } = profile;
  return input;
}

const FIELD_CLASS = 'mt-2 w-full border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand';
const LABEL_CLASS = 'block text-xs font-semibold text-tertiary';

export function BrandProfilesAdmin() {
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<BrandProfileInput>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find(({ id }) => id === selectedId) ?? null,
    [profiles, selectedId],
  );

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/brand-profiles');
      const result = await response.json() as { profiles?: BrandProfile[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not load brand profiles.');
      const nextProfiles = result.profiles ?? [];
      setProfiles(nextProfiles);
      setSelectedId((current) => current ?? nextProfiles[0]?.id ?? 'new');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load brand profiles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (selectedId === 'new') {
      setDraft(EMPTY_PROFILE);
    } else if (selectedProfile) {
      setDraft(profileInput(selectedProfile));
    }
    setSaved(false);
    setError(null);
  }, [selectedId, selectedProfile]);

  const update = <Key extends keyof BrandProfileInput>(
    key: Key,
    value: BrandProfileInput[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      const creating = selectedId === 'new';
      const response = await fetch('/api/admin/brand-profiles', {
        method: creating ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creating
          ? draft
          : { id: selectedId, profile: draft }),
      });
      const result = await response.json() as { profile?: BrandProfile; error?: string };
      if (!response.ok || !result.profile) {
        throw new Error(result.error ?? 'Could not save brand profile.');
      }
      setProfiles((current) => {
        const next = creating
          ? [...current, result.profile!]
          : current.map((profile) => profile.id === result.profile!.id
            ? result.profile!
            : draft.isDefault
              ? { ...profile, isDefault: false }
              : profile);
        return next.sort((a, b) => Number(b.isDefault) - Number(a.isDefault)
          || a.name.localeCompare(b.name));
      });
      setSelectedId(result.profile.id);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save brand profile.');
    } finally {
      setSaving(false);
    }
  };

  const removeProfile = async () => {
    if (!selectedProfile || selectedProfile.isSystem || selectedProfile.isDefault) return;
    if (!window.confirm(`Delete “${selectedProfile.name}”? This cannot be undone.`)) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/brand-profiles?id=${encodeURIComponent(selectedProfile.id)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? 'Could not delete brand profile.');
      }
      const remaining = profiles.filter(({ id }) => id !== selectedProfile.id);
      setProfiles(remaining);
      setSelectedId(remaining[0]?.id ?? 'new');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete brand profile.');
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
              <p className="text-xs font-semibold text-brand-tertiary">Administration</p>
              <h1 className="text-xl font-semibold">Brand profiles</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId('new')}
            className="flex items-center gap-2 bg-brand-solid px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-brand-solid_hover"
          >
            <Plus className="size-4.5" />
            New profile
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-[320px_minmax(0,1fr)] gap-6 p-6">
        <aside className="self-start border border-secondary bg-primary p-3 shadow-xs">
          <div className="px-2 pb-3">
            <p className="text-sm font-semibold">Profiles</p>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-5 text-sm text-quaternary">
              <Loading01 className="size-4 animate-spin" /> Loading profiles…
            </div>
          ) : (
            <div className="space-y-1">
              {profiles.map((profile) => (
                <button
                  type="button"
                  key={profile.id}
                  onClick={() => setSelectedId(profile.id)}
                  className={cx(
                    'flex w-full items-center gap-3 px-3 py-3 text-left transition',
                    selectedId === profile.id
                      ? 'bg-brand-primary'
                      : 'hover:bg-primary_hover',
                  )}
                >
                  <span
                    className="size-8 shrink-0 border border-secondary"
                    style={{ background: `linear-gradient(135deg, ${profile.primaryColor} 50%, ${profile.accentColor} 50%)` }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{profile.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-quaternary">
                      {profile.isDefault ? 'Default · ' : ''}{profile.isSystem ? 'System' : 'Custom'}
                    </span>
                  </span>
                  {!profile.isActive && <span className="size-2 bg-quaternary" title="Inactive" />}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="min-w-0 border border-secondary bg-primary shadow-xs">
          <div className="flex items-center justify-between border-b border-secondary px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold">
                {selectedId === 'new' ? 'Create brand profile' : 'Edit brand profile'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {selectedProfile && !selectedProfile.isSystem && !selectedProfile.isDefault && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={removeProfile}
                  className="flex items-center gap-2 border border-primary px-3.5 py-2.5 text-sm font-semibold text-error-primary hover:bg-error-primary disabled:opacity-50"
                >
                  <Trash01 className="size-4" /> Delete
                </button>
              )}
              <button
                type="button"
                disabled={saving || loading}
                onClick={saveProfile}
                className="flex items-center gap-2 bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-solid_hover disabled:opacity-50"
              >
                {saving ? <Loading01 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : <Edit05 className="size-4" />}
                {saving ? 'Saving…' : saved ? 'Saved' : 'Save profile'}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="mx-6 mt-5 border border-error-primary bg-error-primary px-4 py-3 text-sm text-error-primary">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-6">
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-name">Name</label>
              <input id="brand-name" className={FIELD_CLASS} value={draft.name} onChange={(event) => update('name', event.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-slug">Slug</label>
              <input id="brand-slug" className={FIELD_CLASS} value={draft.slug} onChange={(event) => update('slug', event.target.value)} placeholder="school-brand" />
            </div>
            <div className="col-span-2">
              <label className={LABEL_CLASS} htmlFor="brand-description">Description</label>
              <textarea id="brand-description" rows={2} className={`${FIELD_CLASS} resize-y`} value={draft.description} onChange={(event) => update('description', event.target.value)} />
            </div>

            <div className="col-span-2 border-t border-secondary pt-5">
              <h3 className="text-sm font-semibold">Visual identity</h3>
            </div>
            {([
              ['primaryColor', 'Primary color'],
              ['accentColor', 'Accent color'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className={LABEL_CLASS} htmlFor={`brand-${key}`}>{label}</label>
                <div className="mt-2 flex">
                  <input
                    type="color"
                    aria-label={`${label} picker`}
                    value={draft[key]}
                    onChange={(event) => update(key, event.target.value)}
                    className="h-10 w-12 border border-r-0 border-primary bg-primary p-1"
                  />
                  <input
                    id={`brand-${key}`}
                    value={draft[key]}
                    onChange={(event) => update(key, event.target.value)}
                    className="min-w-0 flex-1 border border-primary bg-primary px-3 py-2 font-mono text-sm uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>
            ))}
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-font">Default font stack</label>
              <input id="brand-font" className={FIELD_CLASS} value={draft.fontFamily} onChange={(event) => update('fontFamily', event.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-logo">Logo URL</label>
              <input id="brand-logo" className={FIELD_CLASS} value={draft.logoUrl ?? ''} onChange={(event) => update('logoUrl', event.target.value || null)} placeholder="/logo/example.svg" />
            </div>

            <div className="col-span-2 border-t border-secondary pt-5">
              <h3 className="text-sm font-semibold">Numbering and locale</h3>
            </div>
            <div className="col-span-2">
              <p className={LABEL_CLASS}>Heading numbering by level</p>
              <div className="mt-2 grid grid-cols-5 gap-3">
                {([1, 2, 3, 4, 5] as const).map((level) => (
                  <div key={level}>
                    <label className="block text-[11px] font-semibold text-quaternary" htmlFor={`heading-format-${level}`}>
                      H{level}
                    </label>
                    <select
                      id={`heading-format-${level}`}
                      className={FIELD_CLASS}
                      value={draft.headingNumberFormats[level]}
                      onChange={(event) => update('headingNumberFormats', {
                        ...draft.headingNumberFormats,
                        [level]: event.target.value as BrandProfileInput['headingNumberFormats'][typeof level],
                      })}
                    >
                      {NUMBER_FORMATS.map((format) => (
                        <option key={format} value={format}>{format}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-quaternary">
                Each segment in a hierarchical number uses the format of its heading level.
              </p>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="instruction-format">Instruction numbering</label>
              <select id="instruction-format" className={FIELD_CLASS} value={draft.instructionNumberFormat} onChange={(event) => update('instructionNumberFormat', event.target.value as BrandProfileInput['instructionNumberFormat'])}>
                {NUMBER_FORMATS.map((format) => <option key={format} value={format}>{format}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="date-format">Date format</label>
              <select id="date-format" className={FIELD_CLASS} value={draft.dateFormat} onChange={(event) => update('dateFormat', event.target.value as BrandProfileInput['dateFormat'])}>
                {DATE_FORMATS.map((format) => <option key={format} value={format}>{format}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex flex-wrap gap-6 border-t border-secondary pt-5">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={draft.isActive} onChange={(event) => update('isActive', event.target.checked)} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={draft.isDefault} onChange={(event) => update('isDefault', event.target.checked)} />
                Default profile
              </label>
              {selectedProfile?.isSystem && (
                <span className="text-sm text-quaternary">System profile · protected from deletion</span>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
