"use client";

import { useEffect, useState } from 'react';
import { PlusSquare, Trash01 } from '@untitledui/icons';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import type { ContextProfile } from '@/lib/context-profiles';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

type ProfileDraft = {
  id: string | null;
  name: string;
  description: string;
  context: WorksheetContext;
};

function emptyDraft(): ProfileDraft {
  return {
    id: null,
    name: '',
    description: '',
    context: { ...EMPTY_WORKSHEET_CONTEXT },
  };
}

export function ContextProfilesManager() {
  const [profiles, setProfiles] = useState<ContextProfile[]>([]);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [pending, setPending] = useState(true);
  const [message, setMessage] = useState('');

  async function loadProfiles() {
    setPending(true);
    const response = await fetch('/api/context-profiles', {
      cache: 'no-store',
    });
    const result = await response.json() as {
      profiles?: ContextProfile[];
      error?: string;
    };
    setProfiles(result.profiles ?? []);
    setMessage(result.error ?? '');
    setPending(false);
  }

  useEffect(() => {
    void loadProfiles();
  }, []);

  const templates = profiles.filter(({ isSystemTemplate }) => isSystemTemplate);
  const userProfiles = profiles.filter(({ isSystemTemplate }) => !isSystemTemplate);

  function editProfile(profile: ContextProfile) {
    setDraft({
      id: profile.isSystemTemplate ? null : profile.id,
      name: profile.isSystemTemplate ? `${profile.name} copy` : profile.name,
      description: profile.description,
      context: {
        ...EMPTY_WORKSHEET_CONTEXT,
        ...profile.context,
        sourceProfileId: null,
      },
    });
    setMessage('');
  }

  async function saveDraft() {
    if (!draft?.name.trim()) {
      setMessage('Profile name is required.');
      return;
    }
    setPending(true);
    setMessage('');
    const response = await fetch('/api/context-profiles', {
      method: draft.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft.id
        ? {
            id: draft.id,
            profile: draft,
          }
        : draft),
    });
    const result = await response.json() as {
      profile?: ContextProfile;
      error?: string;
    };
    if (!response.ok) {
      setMessage(result.error ?? 'Could not save context profile.');
      setPending(false);
      return;
    }
    setDraft(null);
    await loadProfiles();
    setMessage('Context profile saved.');
  }

  async function deleteProfile(profile: ContextProfile) {
    if (!window.confirm(`Delete “${profile.name}”?`)) return;
    setPending(true);
    const response = await fetch(
      `/api/context-profiles?id=${encodeURIComponent(profile.id)}`,
      { method: 'DELETE' },
    );
    if (!response.ok) {
      const result = await response.json() as { error?: string };
      setMessage(result.error ?? 'Could not delete context profile.');
      setPending(false);
      return;
    }
    if (draft?.id === profile.id) setDraft(null);
    await loadProfiles();
  }

  return (
    <section className="rounded-3xl border border-secondary bg-primary p-8 shadow-lg md:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-secondary">
            AI generation
          </p>
          <h2 className="mt-2 text-display-sm font-semibold text-primary">
            Context profiles
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-tertiary">
            Reuse learner and curriculum context across worksheets. Templates
            are copied before editing, so the originals remain unchanged.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft(emptyDraft())}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover"
        >
          <PlusSquare className="size-4" />
          New profile
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(22rem,1.2fr)]">
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-secondary">Templates</h3>
            <div className="mt-2 space-y-2">
              {templates.map((profile) => (
                <button
                  type="button"
                  key={profile.id}
                  onClick={() => editProfile(profile)}
                  className="w-full rounded-lg border border-secondary bg-secondary p-3 text-left hover:bg-primary_hover"
                >
                  <strong className="block text-sm font-semibold text-secondary">
                    {profile.name}
                  </strong>
                  <span className="mt-1 block text-xs text-tertiary">
                    {profile.description || 'Start from this template'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-secondary">
              Your profiles
            </h3>
            <div className="mt-2 space-y-2">
              {!pending && userProfiles.length === 0 && (
                <p className="text-sm text-quaternary">
                  No personal context profiles yet.
                </p>
              )}
              {userProfiles.map((profile) => (
                <div
                  className="flex items-center gap-2 rounded-lg border border-secondary p-2"
                  key={profile.id}
                >
                  <button
                    type="button"
                    onClick={() => editProfile(profile)}
                    className="min-w-0 flex-1 px-1 text-left"
                  >
                    <strong className="block truncate text-sm font-semibold text-secondary">
                      {profile.name}
                    </strong>
                    <span className="mt-0.5 block truncate text-xs text-tertiary">
                      {profile.description || 'Personal profile'}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${profile.name}`}
                    onClick={() => void deleteProfile(profile)}
                    className="flex size-8 items-center justify-center rounded-md text-quaternary hover:bg-error-primary hover:text-error-primary"
                  >
                    <Trash01 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-secondary bg-secondary p-4">
          {draft ? (
            <>
              <label className="block text-xs font-semibold text-tertiary">
                Profile name
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({
                    ...draft,
                    name: event.target.value,
                  })}
                  className="mt-1.5 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
              </label>
              <label className="mt-3 block text-xs font-semibold text-tertiary">
                Description
                <input
                  value={draft.description}
                  onChange={(event) => setDraft({
                    ...draft,
                    description: event.target.value,
                  })}
                  className="mt-1.5 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
              </label>
              <div className="mt-5">
                <DocumentContextFields
                  context={draft.context}
                  onChange={(patch) => setDraft({
                    ...draft,
                    context: { ...draft.context, ...patch },
                  })}
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void saveDraft()}
                  className="rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover disabled:opacity-50"
                >
                  Save profile
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-64 items-center justify-center px-6 text-center">
              <p className="max-w-sm text-sm leading-6 text-tertiary">
                Select one of your profiles to edit it, load a template to
                create a copy, or start a new profile from scratch.
              </p>
            </div>
          )}
        </div>
      </div>
      {message && <p className="mt-4 text-sm text-tertiary">{message}</p>}
    </section>
  );
}
