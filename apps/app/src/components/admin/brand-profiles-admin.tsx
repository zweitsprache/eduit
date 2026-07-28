"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Edit05,
  Loading01,
  Plus,
  Trash01,
} from '@untitledui/icons';
import {
  BRAND_COLOR_TOKENS,
  BRAND_FONT_WEIGHTS,
  BRAND_PROFILE_SETTING_KEYS,
  DATE_FORMATS,
  DEFAULT_BRAND_HEADING_STYLES,
  NUMBER_FORMATS,
  STYLE_PRESETS,
  type BrandProfile,
  type BrandProfileInput,
} from '@/lib/brand-profile-types';
import { cx } from '@/utils/cx';

const EMPTY_PROFILE: BrandProfileInput = {
  parentProfileId: null,
  overriddenFields: [...BRAND_PROFILE_SETTING_KEYS],
  slug: '',
  name: '',
  description: '',
  primaryColor: '#11224d',
  accentColor: '#cc6600',
  customColor1: '#101828',
  customColor2: '#667085',
  fontFamily: '"Encode Sans Semi Condensed", sans-serif',
  stylePreset: 'educational',
  exampleFontFamily: '"Linotype Feltpen", cursive',
  exampleFontSize: 24.5,
  exampleColor: '#009fe3',
  solutionFontFamily: '"Linotype Feltpen", cursive',
  solutionFontSize: 24.5,
  solutionColor: '#079455',
  logoUrl: null,
  logoScale: 1,
  instructionNumberFormat: 'upper-alpha',
  instructionNumberColor: 'inverse',
  instructionNumberFontWeight: 700,
  instructionBadgeStyle: 'filled',
  headingNumberFormats: {
    1: 'decimal',
    2: 'decimal',
    3: 'decimal',
    4: 'decimal',
    5: 'decimal',
  },
  headingStyles: DEFAULT_BRAND_HEADING_STYLES,
  fixedHeadingNumberWidth: false,
  contentIndentation: false,
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
const COLOR_TOKEN_LABELS = {
  defaultText: 'Default text',
  primary: 'Primary',
  accent: 'Accent',
  custom1: 'Custom 1',
  custom2: 'Custom 2',
} as const;
const TASK_NUMBER_COLOR_OPTIONS = [
  { value: 'inverse', label: 'Inverse / white' },
  ...BRAND_COLOR_TOKENS.map((value) => ({
    value,
    label: COLOR_TOKEN_LABELS[value],
  })),
] as const;
const BRAND_PROFILES_UPDATED_KEY = 'eduit-brand-profiles-updated';
const BRAND_PROFILES_UPDATED_EVENT = 'eduit:brand-profiles-updated';

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
    setDraft((current) => ({
      ...current,
      [key]: value,
      overriddenFields: current.parentProfileId
        && BRAND_PROFILE_SETTING_KEYS.includes(
          key as (typeof BRAND_PROFILE_SETTING_KEYS)[number],
        )
        && !current.overriddenFields.includes(
          key as (typeof BRAND_PROFILE_SETTING_KEYS)[number],
        )
        ? [
          ...current.overriddenFields,
          key as (typeof BRAND_PROFILE_SETTING_KEYS)[number],
        ]
        : current.overriddenFields,
    }));
    setSaved(false);
  };

  const updateParent = (parentProfileId: string | null) => {
    setDraft((current) => {
      if (!parentProfileId) {
        return {
          ...current,
          parentProfileId: null,
          overriddenFields: [...BRAND_PROFILE_SETTING_KEYS],
        };
      }
      const parent = profiles.find(({ id }) => id === parentProfileId);
      if (!parent) return current;
      const overriddenFields = selectedId === 'new' && !current.parentProfileId
        ? []
        : current.overriddenFields;
      const next = {
        ...current,
        parentProfileId,
        overriddenFields,
      };
      BRAND_PROFILE_SETTING_KEYS.forEach((key) => {
        if (!overriddenFields.includes(key)) {
          Object.assign(next, { [key]: parent[key] });
        }
      });
      return next;
    });
    setSaved(false);
  };

  const resetToParent = () => {
    const parent = profiles.find(({ id }) => id === draft.parentProfileId);
    if (!parent) return;
    setDraft((current) => {
      const next = {
        ...current,
        overriddenFields: [],
      };
      BRAND_PROFILE_SETTING_KEYS.forEach((key) => {
        Object.assign(next, { [key]: parent[key] });
      });
      return next;
    });
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
      setSelectedId(result.profile.id);
      await loadProfiles();
      localStorage.setItem(BRAND_PROFILES_UPDATED_KEY, String(Date.now()));
      window.dispatchEvent(new Event(BRAND_PROFILES_UPDATED_EVENT));
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
    <div className="min-h-full bg-secondary text-primary">
      <div className="border-b border-secondary bg-primary">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold text-brand-tertiary">Administration</p>
            <h1 className="text-xl font-semibold">Brand profiles</h1>
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
      </div>

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
                      {profile.isDefault ? 'Default · ' : ''}
                      {profile.isSystem ? 'System' : 'Custom'}
                      {' · '}
                      {profile.stylePreset === 'educational'
                        ? 'Educational'
                        : profile.stylePreset === 'semi-academic'
                          ? 'Semi-Academic'
                          : 'Academic'}
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
            <div className="col-span-2">
              <div className="flex items-end justify-between gap-4">
                <label className={`${LABEL_CLASS} min-w-0 flex-1`} htmlFor="brand-parent-profile">
                  Parent profile
                  <select
                    id="brand-parent-profile"
                    className={FIELD_CLASS}
                    value={draft.parentProfileId ?? ''}
                    onChange={(event) => updateParent(event.target.value || null)}
                  >
                    <option value="">No parent profile</option>
                    {profiles
                      .filter(({ id }) => id !== selectedId)
                      .map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                  </select>
                </label>
                {draft.parentProfileId && (
                  <button
                    type="button"
                    onClick={resetToParent}
                    className="mb-0.5 shrink-0 border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
                  >
                    Reset settings to parent
                  </button>
                )}
              </div>
              {draft.parentProfileId && (
                <p className="mt-2 text-xs leading-5 text-quaternary">
                  {draft.overriddenFields.length
                    ? `${draft.overriddenFields.length} settings override the parent.`
                    : 'All settings are inherited from the parent.'}
                </p>
              )}
            </div>

            <div className="col-span-2 border-t border-secondary pt-5">
              <h3 className="text-sm font-semibold">Visual identity</h3>
            </div>
            {([
              ['primaryColor', 'Primary color'],
              ['accentColor', 'Accent color'],
              ['customColor1', 'Custom 1'],
              ['customColor2', 'Custom 2'],
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
                    className="min-w-0 flex-1 border border-primary bg-primary px-3 py-2 text-sm uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>
            ))}
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-font">Default font stack</label>
              <input id="brand-font" className={FIELD_CLASS} value={draft.fontFamily} onChange={(event) => update('fontFamily', event.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-style-preset">
                Document style
              </label>
              <select
                id="brand-style-preset"
                className={FIELD_CLASS}
                value={draft.stylePreset}
                onChange={(event) => update(
                  'stylePreset',
                  event.target.value as BrandProfileInput['stylePreset'],
                )}
              >
                {STYLE_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset === 'educational'
                      ? 'Educational'
                      : preset === 'semi-academic'
                        ? 'Semi-Academic'
                        : 'Academic'}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-quaternary">
                Educational is spacious. Semi-Academic keeps the academic
                layout with slightly larger body text. Academic is the most
                compact.
              </p>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-logo">Logo URL</label>
              <input id="brand-logo" className={FIELD_CLASS} value={draft.logoUrl ?? ''} onChange={(event) => update('logoUrl', event.target.value || null)} placeholder="/logo/example.svg" />
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label className={LABEL_CLASS} htmlFor="brand-logo-scale">
                  Logo scale
                </label>
                <span className="text-xs tabular-nums text-quaternary">
                  {Math.round(draft.logoScale * 100)}%
                </span>
              </div>
              <input
                id="brand-logo-scale"
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={draft.logoScale}
                onChange={(event) => update(
                  'logoScale',
                  Number(event.target.value),
                )}
                className="mt-3 w-full accent-[var(--color-bg-brand-solid)]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-quaternary">
                <span>50%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
              <p className="mt-2 text-xs text-quaternary">
                Scaling keeps the logo’s top-right origin and does not change
                header geometry.
              </p>
            </div>

            <div className="col-span-2 border-t border-secondary pt-5">
              <h3 className="text-sm font-semibold">Solution styling</h3>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-solution-font">
                Solution font stack
              </label>
              <input
                id="brand-solution-font"
                className={FIELD_CLASS}
                value={draft.solutionFontFamily}
                onChange={(event) => update(
                  'solutionFontFamily',
                  event.target.value,
                )}
              />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-solution-font-size">
                Solution font size (px)
              </label>
              <input
                id="brand-solution-font-size"
                type="number"
                min="8"
                max="72"
                step="0.5"
                className={FIELD_CLASS}
                value={draft.solutionFontSize}
                onChange={(event) => {
                  const size = event.currentTarget.valueAsNumber;
                  if (Number.isFinite(size)) {
                    update('solutionFontSize', size);
                  }
                }}
              />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-solution-color">
                Solution color
              </label>
              <div className="mt-2 flex">
                <input
                  type="color"
                  aria-label="Solution color picker"
                  value={draft.solutionColor}
                  onChange={(event) => update(
                    'solutionColor',
                    event.target.value,
                  )}
                  className="h-10 w-12 border border-r-0 border-primary bg-primary p-1"
                />
                <input
                  id="brand-solution-color"
                  value={draft.solutionColor}
                  onChange={(event) => update(
                    'solutionColor',
                    event.target.value,
                  )}
                  className="min-w-0 flex-1 border border-primary bg-primary px-3 py-2 text-sm uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="col-span-2 border-t border-secondary pt-5">
              <h3 className="text-sm font-semibold">Example styling</h3>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-example-font">
                Example font stack
              </label>
              <input
                id="brand-example-font"
                className={FIELD_CLASS}
                value={draft.exampleFontFamily}
                onChange={(event) => update(
                  'exampleFontFamily',
                  event.target.value,
                )}
              />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-example-font-size">
                Example font size (px)
              </label>
              <input
                id="brand-example-font-size"
                type="number"
                min="8"
                max="72"
                step="0.5"
                className={FIELD_CLASS}
                value={draft.exampleFontSize}
                onChange={(event) => {
                  const size = event.currentTarget.valueAsNumber;
                  if (Number.isFinite(size)) {
                    update('exampleFontSize', size);
                  }
                }}
              />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="brand-example-color">
                Example color
              </label>
              <div className="mt-2 flex">
                <input
                  type="color"
                  aria-label="Example color picker"
                  value={draft.exampleColor}
                  onChange={(event) => update(
                    'exampleColor',
                    event.target.value,
                  )}
                  className="h-10 w-12 border border-r-0 border-primary bg-primary p-1"
                />
                <input
                  id="brand-example-color"
                  value={draft.exampleColor}
                  onChange={(event) => update(
                    'exampleColor',
                    event.target.value,
                  )}
                  className="min-w-0 flex-1 border border-primary bg-primary px-3 py-2 text-sm uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="col-span-2 border-t border-secondary pt-5">
              <h3 className="text-sm font-semibold">Numbering and locale</h3>
            </div>
            <div className="col-span-2">
              <p className={LABEL_CLASS}>Heading numbering by level</p>
              <label className="mt-3 flex items-center justify-between gap-4 border border-secondary bg-secondary px-3 py-2.5">
                <span>
                  <span className="block text-xs font-semibold text-secondary">
                    Fixed number width
                  </span>
                  <span className="mt-0.5 block text-xs text-quaternary">
                    Right-align all counters in the width of one H1 glyph.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.fixedHeadingNumberWidth}
                  onChange={(event) => update(
                    'fixedHeadingNumberWidth',
                    event.target.checked,
                  )}
                />
              </label>
              <div className="mt-2 space-y-3">
                {([1, 2, 3, 4, 5] as const).map((level) => (
                  <div
                    className="border border-secondary bg-secondary p-3"
                    key={level}
                  >
                    <p className="text-xs font-semibold text-secondary">
                      H{level}
                    </p>
                    <div className="mt-2 grid grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-quaternary" htmlFor={`heading-format-${level}`}>
                          Number format
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
                      <div>
                        <label className="block text-[11px] font-semibold text-quaternary" htmlFor={`heading-number-color-${level}`}>
                          Number color
                        </label>
                        <select
                          id={`heading-number-color-${level}`}
                          className={FIELD_CLASS}
                          value={draft.headingStyles[level].numberColor}
                          onChange={(event) => update('headingStyles', {
                            ...draft.headingStyles,
                            [level]: {
                              ...draft.headingStyles[level],
                              numberColor: event.target.value as
                                BrandProfileInput['headingStyles'][typeof level]['numberColor'],
                            },
                          })}
                        >
                          {BRAND_COLOR_TOKENS.map((token) => (
                            <option key={token} value={token}>
                              {COLOR_TOKEN_LABELS[token]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-quaternary" htmlFor={`heading-number-weight-${level}`}>
                          Number weight
                        </label>
                        <select
                          id={`heading-number-weight-${level}`}
                          className={FIELD_CLASS}
                          value={draft.headingStyles[level].numberFontWeight}
                          onChange={(event) => update('headingStyles', {
                            ...draft.headingStyles,
                            [level]: {
                              ...draft.headingStyles[level],
                              numberFontWeight: Number(event.target.value) as
                                BrandProfileInput['headingStyles'][typeof level]['numberFontWeight'],
                            },
                          })}
                        >
                          {BRAND_FONT_WEIGHTS.map((weight) => (
                            <option key={weight} value={weight}>{weight}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-quaternary" htmlFor={`heading-text-color-${level}`}>
                          Text color
                        </label>
                        <select
                          id={`heading-text-color-${level}`}
                          className={FIELD_CLASS}
                          value={draft.headingStyles[level].textColor}
                          onChange={(event) => update('headingStyles', {
                            ...draft.headingStyles,
                            [level]: {
                              ...draft.headingStyles[level],
                              textColor: event.target.value as
                                BrandProfileInput['headingStyles'][typeof level]['textColor'],
                            },
                          })}
                        >
                          {BRAND_COLOR_TOKENS.map((token) => (
                            <option key={token} value={token}>
                              {COLOR_TOKEN_LABELS[token]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-quaternary" htmlFor={`heading-text-weight-${level}`}>
                          Text weight
                        </label>
                        <select
                          id={`heading-text-weight-${level}`}
                          className={FIELD_CLASS}
                          value={draft.headingStyles[level].textFontWeight}
                          onChange={(event) => update('headingStyles', {
                            ...draft.headingStyles,
                            [level]: {
                              ...draft.headingStyles[level],
                              textFontWeight: Number(event.target.value) as
                                BrandProfileInput['headingStyles'][typeof level]['textFontWeight'],
                            },
                          })}
                        >
                          {BRAND_FONT_WEIGHTS.map((weight) => (
                            <option key={weight} value={weight}>{weight}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-quaternary">
                Number and heading text are styled independently at every
                level.
              </p>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="instruction-format">Task Numbering</label>
              <select id="instruction-format" className={FIELD_CLASS} value={draft.instructionNumberFormat} onChange={(event) => update('instructionNumberFormat', event.target.value as BrandProfileInput['instructionNumberFormat'])}>
                {NUMBER_FORMATS.map((format) => <option key={format} value={format}>{format}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="instruction-badge-style">
                Task number style
              </label>
              <select
                id="instruction-badge-style"
                className={FIELD_CLASS}
                value={draft.instructionBadgeStyle}
                onChange={(event) => update(
                  'instructionBadgeStyle',
                  event.target.value as
                    BrandProfileInput['instructionBadgeStyle'],
                )}
              >
                <option value="filled">Filled badge</option>
                <option value="primary-text">Primary text</option>
                <option value="accent-text">Accent text</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="instruction-number-color">
                Task number color
              </label>
              <select
                id="instruction-number-color"
                className={FIELD_CLASS}
                value={draft.instructionNumberColor}
                onChange={(event) => update(
                  'instructionNumberColor',
                  event.target.value as
                    BrandProfileInput['instructionNumberColor'],
                )}
              >
                {TASK_NUMBER_COLOR_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="instruction-number-weight">
                Task number weight
              </label>
              <select
                id="instruction-number-weight"
                className={FIELD_CLASS}
                value={draft.instructionNumberFontWeight}
                onChange={(event) => update(
                  'instructionNumberFontWeight',
                  Number(event.target.value) as
                    BrandProfileInput['instructionNumberFontWeight'],
                )}
              >
                {BRAND_FONT_WEIGHTS.map((weight) => (
                  <option key={weight} value={weight}>{weight}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="flex items-center justify-between gap-4 border border-secondary bg-secondary px-3 py-2.5">
                <span>
                  <span className="block text-xs font-semibold text-secondary">
                    Content indentation
                  </span>
                  <span className="mt-0.5 block text-xs text-quaternary">
                    Align custom-block content with the task instruction text.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.contentIndentation}
                  onChange={(event) => update(
                    'contentIndentation',
                    event.target.checked,
                  )}
                />
              </label>
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
    </div>
  );
}
