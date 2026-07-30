"use client";

import {
  Image01,
  Loading01,
  SearchLg,
  Trash01,
  UploadCloud01,
  XClose,
} from '@untitledui/icons';
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { UserMedia } from '@/lib/media';

type MediaLibraryModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (image: { src: string; alt: string }) => void;
};

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

function formattedBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryModal({
  open,
  onClose,
  onSelect,
}: MediaLibraryModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<UserMedia[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftAlt, setDraftAlt] = useState('');
  const selected = media.find(({ id }) => id === selectedId) ?? null;

  const loadMedia = useCallback(async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/media${search ? `?q=${encodeURIComponent(search)}` : ''}`,
        { cache: 'no-store' },
      );
      const result = await response.json() as {
        media?: UserMedia[];
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? 'Could not load media.');
      setMedia(result.media ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error
        ? loadError.message
        : 'Could not load media.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedId(null);
    void loadMedia();
  }, [loadMedia, open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => void loadMedia(query), 250);
    return () => clearTimeout(timer);
  }, [loadMedia, open, query]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose, open]);

  useEffect(() => {
    setDraftName(selected?.name ?? '');
    setDraftAlt(selected?.alt ?? '');
  }, [selected]);

  const uploadFiles = async (files: File[]) => {
    const images = files.filter(({ type }) => ACCEPT.includes(type));
    if (!images.length) {
      setError('Choose a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    setUploading(true);
    setError('');
    let mostRecent: UserMedia | null = null;
    try {
      for (const file of images) {
        const form = new FormData();
        form.set('file', file);
        const response = await fetch('/api/media', {
          method: 'POST',
          body: form,
        });
        const result = await response.json() as {
          media?: UserMedia;
          error?: string;
        };
        if (!response.ok || !result.media) {
          throw new Error(result.error ?? `Could not upload ${file.name}.`);
        }
        mostRecent = result.media;
      }
      setQuery('');
      await loadMedia();
      if (mostRecent) setSelectedId(mostRecent.id);
    } catch (uploadError) {
      setError(uploadError instanceof Error
        ? uploadError.message
        : 'Could not upload image.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    void uploadFiles(Array.from(event.target.files ?? []));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const saveSelected = async () => {
    if (!selected || !draftName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          name: draftName,
          alt: draftAlt,
        }),
      });
      const result = await response.json() as {
        media?: UserMedia;
        error?: string;
      };
      if (!response.ok || !result.media) {
        throw new Error(result.error ?? 'Could not save media.');
      }
      setMedia((current) => current.map((item) => (
        item.id === result.media?.id ? result.media : item
      )));
    } catch (saveError) {
      setError(saveError instanceof Error
        ? saveError.message
        : 'Could not save media.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selected || !window.confirm(
      `Delete “${selected.name}”? Worksheets using this image will no longer be able to display it.`,
    )) return;
    setDeleting(true);
    setError('');
    try {
      const response = await fetch(
        `/api/media?id=${encodeURIComponent(selected.id)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null) as {
          error?: string;
        } | null;
        throw new Error(result?.error ?? 'Could not delete media.');
      }
      setMedia((current) => current.filter(({ id }) => id !== selected.id));
      setSelectedId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error
        ? deleteError.message
        : 'Could not delete media.');
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      aria-label="Media library"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-overlay/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <div className="flex max-h-[90vh] min-h-[38rem] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-secondary bg-primary shadow-xl">
        <header className="flex items-center justify-between border-b border-secondary px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Media library</h2>
            <p className="mt-0.5 text-sm text-tertiary">
              Your private images are reusable across worksheets.
            </p>
          </div>
          <button
            aria-label="Close media library"
            className="flex size-9 items-center justify-center rounded-lg text-quaternary transition hover:bg-primary_hover hover:text-secondary"
            onClick={onClose}
            type="button"
          >
            <XClose className="size-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="flex min-h-0 flex-col p-5">
            <div className="flex gap-3">
              <label className="relative min-w-0 flex-1">
                <SearchLg className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-quaternary" />
                <input
                  aria-label="Search media"
                  className="h-10 w-full rounded-lg border border-primary bg-primary pr-3 pl-9 text-sm text-secondary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search images"
                  value={query}
                />
              </label>
              <input
                ref={inputRef}
                accept={ACCEPT}
                className="hidden"
                multiple
                onChange={handleFiles}
                type="file"
              />
              <button
                className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-solid px-4 text-sm font-semibold text-white hover:bg-brand-solid_hover disabled:cursor-wait disabled:opacity-60"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                {uploading
                  ? <Loading01 className="size-4 animate-spin" />
                  : <UploadCloud01 className="size-4" />}
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>

            <div
              className={[
                'mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border border-dashed p-3 transition',
                dragActive
                  ? 'border-brand bg-brand-primary'
                  : 'border-secondary',
              ].join(' ')}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDragActive(false);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              {loading ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loading01 className="size-6 animate-spin text-quaternary" />
                </div>
              ) : media.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {media.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      onDoubleClick={() => {
                        onSelect({ src: item.src, alt: item.alt || item.name });
                        onClose();
                      }}
                      className={[
                        'overflow-hidden rounded-lg border bg-secondary text-left transition',
                        selectedId === item.id
                          ? 'border-brand ring-2 ring-brand'
                          : 'border-primary hover:border-brand',
                      ].join(' ')}
                    >
                      <img
                        alt={item.alt || item.name}
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                        src={item.src}
                      />
                      <span className="block truncate border-t border-primary px-2.5 py-2 text-xs font-semibold text-secondary">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  className="flex flex-1 flex-col items-center justify-center px-6 text-center"
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
                    <Image01 className="size-6 text-quaternary" />
                  </span>
                  <span className="mt-3 text-sm font-semibold text-secondary">
                    {query ? 'No matching images' : 'Upload your first image'}
                  </span>
                  <span className="mt-1 text-xs text-quaternary">
                    Drop images here or choose files · maximum 10 MB each
                  </span>
                </button>
              )}
            </div>
          </section>

          <aside className="min-h-0 overflow-y-auto border-t border-secondary bg-secondary p-5 md:border-t-0 md:border-l">
            {selected ? (
              <>
                <img
                  alt={selected.alt || selected.name}
                  className="aspect-[4/3] w-full rounded-lg border border-primary bg-primary object-contain"
                  src={selected.src}
                />
                <p className="mt-3 truncate text-xs text-quaternary">
                  {selected.filename}
                </p>
                <p className="mt-1 text-xs text-quaternary">
                  {selected.width && selected.height
                    ? `${selected.width} × ${selected.height} · `
                    : ''}
                  {formattedBytes(selected.size)}
                </p>
                <label className="mt-4 block text-sm font-semibold text-secondary">
                  Name
                  <input
                    className="mt-1.5 h-10 w-full rounded-lg border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    maxLength={160}
                    onChange={(event) => setDraftName(event.target.value)}
                    value={draftName}
                  />
                </label>
                <label className="mt-3 block text-sm font-semibold text-secondary">
                  Alternative text
                  <textarea
                    className="mt-1.5 min-h-20 w-full resize-y rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    maxLength={500}
                    onChange={(event) => setDraftAlt(event.target.value)}
                    placeholder="Describe the image for accessibility"
                    value={draftAlt}
                  />
                </label>
                <button
                  type="button"
                  disabled={
                    saving
                    || !draftName.trim()
                    || (draftName === selected.name && draftAlt === selected.alt)
                  }
                  onClick={() => void saveSelected()}
                  className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 text-sm font-semibold text-secondary hover:bg-primary_hover disabled:opacity-50"
                >
                  {saving && <Loading01 className="size-4 animate-spin" />}
                  Save details
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void deleteSelected()}
                  className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-error-primary hover:bg-error-primary/10 disabled:opacity-50"
                >
                  {deleting
                    ? <Loading01 className="size-4 animate-spin" />
                    : <Trash01 className="size-4" />}
                  Delete image
                </button>
              </>
            ) : (
              <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                <Image01 className="size-6 text-quaternary" />
                <p className="mt-3 text-sm font-semibold text-secondary">
                  Select an image
                </p>
                <p className="mt-1 text-xs leading-5 text-quaternary">
                  View image details, edit accessibility text, or delete it.
                </p>
              </div>
            )}
          </aside>
        </div>

        {error && (
          <p className="border-t border-error-secondary bg-error-primary/5 px-6 py-2 text-sm text-error-primary">
            {error}
          </p>
        )}
        <footer className="flex items-center justify-between border-t border-secondary px-6 py-3">
          <p className="text-xs text-quaternary">
            {media.length} {media.length === 1 ? 'image' : 'images'}
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover disabled:opacity-50"
              disabled={!selected}
              onClick={() => {
                if (!selected) return;
                onSelect({
                  src: selected.src,
                  alt: draftAlt.trim() || selected.alt || selected.name,
                });
                onClose();
              }}
              type="button"
            >
              Use image
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
