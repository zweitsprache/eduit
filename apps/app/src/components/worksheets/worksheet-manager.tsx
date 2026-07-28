"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Copy01,
  ChevronRight,
  DotsVertical,
  Edit05,
  File02,
  Folder,
  FolderPlus,
  Grid01,
  HomeLine,
  List,
  Loading01,
  Plus,
  SearchLg,
  Trash01,
} from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import type {
  Worksheet,
  WorksheetFolder,
  WorksheetStatus,
} from '@/lib/worksheet-types';
import { cx } from '@/utils/cx';
import { useI18n } from '@/components/i18n/locale-provider';

type StatusFilter = 'all' | WorksheetStatus;
type SortMode = 'updated' | 'created' | 'title';
type ViewMode = 'cards' | 'list';
type FolderDialog = {
  mode: 'create' | 'rename';
  folder?: WorksheetFolder;
} | null;
type MoveDialog = {
  worksheet: Worksheet;
  destinationId: string | null;
} | null;

function formatUpdatedAt(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-CH' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function worksheetSubject(worksheet: Worksheet) {
  return worksheet.context.subject === 'other'
    ? worksheet.context.customSubject
    : worksheet.context.subject;
}

export function WorksheetManager() {
  const { locale, t } = useI18n();
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [folders, setFolders] = useState<WorksheetFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderDialog, setFolderDialog] = useState<FolderDialog>(null);
  const [folderName, setFolderName] = useState('');
  const [savingFolder, setSavingFolder] = useState(false);
  const [moveDialog, setMoveDialog] = useState<MoveDialog>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [worksheetResponse, folderResponse] = await Promise.all([
        fetch('/api/worksheets', { cache: 'no-store' }),
        fetch('/api/worksheet-folders', { cache: 'no-store' }),
      ]);
      const result = await worksheetResponse.json() as {
        worksheets?: Worksheet[];
        error?: string;
      };
      const folderResult = await folderResponse.json() as {
        folders?: WorksheetFolder[];
        error?: string;
      };
      if (!worksheetResponse.ok) {
        throw new Error(result.error ?? t('documents.loadError'));
      }
      if (!folderResponse.ok) {
        throw new Error(folderResult.error ?? t('documents.folderLoadError'));
      }
      setWorksheets(result.worksheets ?? []);
      setFolders(folderResult.folders ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error
        ? loadError.message
        : t('documents.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const stored = window.localStorage.getItem('eduit-worksheet-library-view');
    if (stored === 'cards' || stored === 'list') setViewMode(stored);
  }, []);

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

  const visibleWorksheets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return worksheets
      .filter((worksheet) => (
        statusFilter === 'all' || worksheet.status === statusFilter
      ))
      .filter((worksheet) => worksheet.folderId === currentFolderId)
      .filter((worksheet) => {
        if (!normalizedQuery) return true;
        return [
          worksheet.title,
          worksheet.brandProfileName ?? '',
          worksheetSubject(worksheet),
          worksheet.context.contentLanguage,
        ].some((value) => (
          value.toLocaleLowerCase(locale).includes(normalizedQuery)
        ));
      })
      .sort((a, b) => {
        if (sortMode === 'title') {
          return a.title.localeCompare(b.title, locale);
        }
        return sortMode === 'created'
          ? b.createdAt.localeCompare(a.createdAt)
          : b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [
    currentFolderId,
    locale,
    query,
    sortMode,
    statusFilter,
    worksheets,
  ]);

  const childFolders = useMemo(() => (
    folders.filter(({ parentId }) => parentId === currentFolderId)
  ), [currentFolderId, folders]);

  const folderBreadcrumbs = useMemo(() => {
    const path: WorksheetFolder[] = [];
    const seen = new Set<string>();
    let id = currentFolderId;
    while (id && !seen.has(id)) {
      seen.add(id);
      const folder = folders.find((candidate) => candidate.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parentId;
    }
    return path;
  }, [currentFolderId, folders]);

  const folderOptions = useMemo(() => {
    const result: Array<WorksheetFolder & { depth: number }> = [];
    const visit = (parentId: string | null, depth: number) => {
      folders
        .filter((folder) => folder.parentId === parentId)
        .forEach((folder) => {
          result.push({ ...folder, depth });
          visit(folder.id, depth + 1);
        });
    };
    visit(null, 0);
    return result;
  }, [folders]);

  async function createWorksheet() {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t('documents.untitledWorksheet'),
          folderId: currentFolderId,
        }),
      });
      const result = await response.json() as {
        worksheet?: Worksheet;
        error?: string;
      };
      if (!response.ok || !result.worksheet) {
        throw new Error(result.error ?? t('documents.createError'));
      }
      window.location.href =
        `/editor?worksheet=${encodeURIComponent(result.worksheet.id)}`;
    } catch (createError) {
      setError(createError instanceof Error
        ? createError.message
        : t('documents.createError'));
      setCreating(false);
    }
  }

  function selectViewMode(mode: ViewMode) {
    setViewMode(mode);
    window.localStorage.setItem('eduit-worksheet-library-view', mode);
  }

  async function duplicateWorksheet(worksheet: Worksheet) {
    setBusyId(worksheet.id);
    setError(null);
    try {
      const response = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t('documents.copyTitle', { title: worksheet.title }),
          contentHtml: worksheet.contentHtml,
          documentSize: worksheet.documentSize,
          showSolutions: worksheet.showSolutions,
          context: worksheet.context,
          status: 'draft',
          brandProfileId: worksheet.brandProfileId,
          folderId: worksheet.folderId,
        }),
      });
      const result = await response.json() as {
        worksheet?: Worksheet;
        error?: string;
      };
      if (!response.ok || !result.worksheet) {
        throw new Error(result.error ?? t('documents.duplicateError'));
      }
      setWorksheets((current) => [result.worksheet!, ...current]);
    } catch (duplicateError) {
      setError(duplicateError instanceof Error
        ? duplicateError.message
        : t('documents.duplicateError'));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteWorksheet(worksheet: Worksheet) {
    if (!window.confirm(t('documents.deleteConfirm', {
      title: worksheet.title,
    }))) return;
    setBusyId(worksheet.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/worksheets?id=${encodeURIComponent(worksheet.id)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null) as {
          error?: string;
        } | null;
        throw new Error(result?.error ?? t('documents.deleteError'));
      }
      setWorksheets((current) => (
        current.filter(({ id }) => id !== worksheet.id)
      ));
    } catch (deleteError) {
      setError(deleteError instanceof Error
        ? deleteError.message
        : t('documents.deleteError'));
    } finally {
      setBusyId(null);
    }
  }

  function openCreateFolder() {
    setFolderName('');
    setFolderDialog({ mode: 'create' });
  }

  function openRenameFolder(folder: WorksheetFolder) {
    setFolderName(folder.name);
    setFolderDialog({ mode: 'rename', folder });
  }

  async function saveFolder() {
    if (!folderDialog || !folderName.trim()) return;
    setSavingFolder(true);
    setError(null);
    try {
      const response = await fetch('/api/worksheet-folders', {
        method: folderDialog.mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderDialog.mode === 'create'
          ? { name: folderName, parentId: currentFolderId }
          : { id: folderDialog.folder?.id, name: folderName }),
      });
      const result = await response.json() as {
        folder?: WorksheetFolder;
        error?: string;
      };
      if (!response.ok || !result.folder) {
        throw new Error(result.error ?? t('documents.folderSaveError'));
      }
      setFolders((current) => folderDialog.mode === 'create'
        ? [...current, result.folder!]
        : current.map((folder) => (
          folder.id === result.folder!.id ? result.folder! : folder
        )));
      setFolderDialog(null);
    } catch (folderError) {
      setError(folderError instanceof Error
        ? folderError.message
        : t('documents.folderSaveError'));
    } finally {
      setSavingFolder(false);
    }
  }

  async function deleteFolder(folder: WorksheetFolder) {
    if (!window.confirm(t('documents.folderDeleteConfirm', {
      name: folder.name,
    }))) return;
    setError(null);
    try {
      const response = await fetch(
        `/api/worksheet-folders?id=${encodeURIComponent(folder.id)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null) as {
          error?: string;
        } | null;
        throw new Error(result?.error ?? t('documents.folderDeleteError'));
      }
      const removedIds = new Set<string>([folder.id]);
      let changed = true;
      while (changed) {
        changed = false;
        folders.forEach((candidate) => {
          if (
            candidate.parentId
            && removedIds.has(candidate.parentId)
            && !removedIds.has(candidate.id)
          ) {
            removedIds.add(candidate.id);
            changed = true;
          }
        });
      }
      setFolders((current) => (
        current.filter(({ id }) => !removedIds.has(id))
      ));
      setWorksheets((current) => current.map((worksheet) => (
        worksheet.folderId && removedIds.has(worksheet.folderId)
          ? { ...worksheet, folderId: null }
          : worksheet
      )));
      if (currentFolderId && removedIds.has(currentFolderId)) {
        setCurrentFolderId(null);
      }
    } catch (folderError) {
      setError(folderError instanceof Error
        ? folderError.message
        : t('documents.folderDeleteError'));
    }
  }

  async function moveWorksheet(worksheet: Worksheet, folderId: string | null) {
    setBusyId(worksheet.id);
    setError(null);
    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: worksheet.id,
          worksheet: { folderId },
        }),
      });
      const result = await response.json() as {
        worksheet?: Worksheet;
        error?: string;
      };
      if (!response.ok || !result.worksheet) {
        throw new Error(result.error ?? t('documents.moveError'));
      }
      setWorksheets((current) => current.map((candidate) => (
        candidate.id === worksheet.id ? result.worksheet! : candidate
      )));
      setOpenMenuId(null);
      return true;
    } catch (moveError) {
      setError(moveError instanceof Error
        ? moveError.message
        : t('documents.moveError'));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-full bg-secondary text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-8">
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-error-primary bg-error-primary px-4 py-3 text-sm text-error-primary"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 border-b border-secondary pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <SearchLg className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-quaternary" />
            <input
              aria-label={t('documents.search')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('documents.searchPlaceholder')}
              className="h-11 w-full rounded-lg border border-primary bg-primary pl-10 pr-3 text-sm text-primary shadow-xs outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg bg-primary p-1 shadow-xs ring-1 ring-inset ring-primary">
              {([
                ['all', t('documents.filterAll')],
                ['draft', t('common.draft')],
                ['published', t('common.published')],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={cx(
                    'rounded-md px-3 py-1.5 text-sm font-semibold transition',
                    statusFilter === value
                      ? 'bg-brand-primary text-brand-secondary'
                      : 'text-tertiary hover:bg-primary_hover hover:text-secondary',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              aria-label={t('documents.sortBy')}
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-10 rounded-lg border border-primary bg-primary px-3 text-sm font-semibold text-secondary shadow-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            >
              <option value="updated">{t('documents.sortUpdated')}</option>
              <option value="created">{t('documents.sortCreated')}</option>
              <option value="title">{t('documents.sortTitle')}</option>
            </select>
            <div className="inline-flex rounded-lg bg-primary p-1 shadow-xs ring-1 ring-inset ring-primary">
              {([
                ['cards', t('documents.viewCards'), Grid01],
                ['list', t('documents.viewList'), List],
              ] as const).map(([value, label, Icon]) => (
                <button
                  type="button"
                  key={value}
                  title={label}
                  aria-label={label}
                  aria-pressed={viewMode === value}
                  onClick={() => selectViewMode(value)}
                  className={cx(
                    'flex size-8 items-center justify-center rounded-md transition',
                    viewMode === value
                      ? 'bg-brand-primary text-fg-brand-primary'
                      : 'text-fg-quaternary hover:bg-primary_hover hover:text-fg-secondary',
                  )}
                >
                  <Icon className="size-4.5" />
                </button>
              ))}
            </div>
            <Button
              color="secondary"
              iconLeading={<FolderPlus className="size-5" />}
              onPress={openCreateFolder}
            >
              {t('documents.newFolder')}
            </Button>
            <Button
              isDisabled={creating}
              iconLeading={creating
                ? <Loading01 className="size-5 animate-spin" />
                : <Plus className="size-5" />}
              onPress={() => void createWorksheet()}
            >
              {t('documents.newWorksheet')}
            </Button>
          </div>
        </div>

        <nav
          aria-label={t('documents.folderPath')}
          className="mt-5 flex min-h-8 flex-wrap items-center gap-1 text-sm"
        >
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className={cx(
              'flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold transition hover:bg-primary_hover',
              currentFolderId === null
                ? 'text-primary'
                : 'text-tertiary',
            )}
          >
            <HomeLine className="size-4" />
            {t('documents.libraryRoot')}
          </button>
          {folderBreadcrumbs.map((folder) => (
            <span key={folder.id} className="flex items-center gap-1">
              <ChevronRight className="size-4 text-fg-quaternary" />
              <button
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className={cx(
                  'rounded-md px-2 py-1 font-semibold transition hover:bg-primary_hover',
                  folder.id === currentFolderId
                    ? 'text-primary'
                    : 'text-tertiary',
                )}
              >
                {folder.name}
              </button>
            </span>
          ))}
        </nav>

        {childFolders.length > 0 && (
          <div className={cx(
            'mt-4',
            viewMode === 'cards'
              ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
              : 'flex flex-col gap-2',
          )}>
            {childFolders.map((folder) => (
              <div
                key={folder.id}
                className="group/folder relative flex items-center gap-3 rounded-xl border border-secondary bg-primary p-3 shadow-xs transition hover:border-primary hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary">
                    <Folder className="size-5 text-fg-brand-primary" />
                  </span>
                  <span className="truncate text-sm font-semibold text-primary">
                    {folder.name}
                  </span>
                </button>
                <details className="relative z-10">
                  <summary
                    aria-label={t('documents.folderActions')}
                    className="flex size-8 cursor-pointer list-none items-center justify-center rounded-md text-fg-quaternary transition hover:bg-primary_hover hover:text-fg-secondary [&::-webkit-details-marker]:hidden"
                  >
                    <DotsVertical className="size-5" />
                  </summary>
                  <div className="absolute right-0 top-9 z-30 w-40 rounded-lg border border-secondary bg-primary p-1.5 shadow-lg">
                    <button
                      type="button"
                      onClick={() => openRenameFolder(folder)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-semibold text-secondary hover:bg-primary_hover"
                    >
                      <Edit05 className="size-4 text-fg-quaternary" />
                      {t('common.rename')}
                    </button>
                    <div className="my-1 border-t border-secondary" />
                    <button
                      type="button"
                      onClick={() => void deleteFolder(folder)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-semibold text-error-primary hover:bg-error-primary"
                    >
                      <Trash01 className="size-4" />
                      {t('common.delete')}
                    </button>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-secondary">
            {t('documents.worksheetCount', {
              count: visibleWorksheets.length,
            })}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-quaternary">
            <Loading01 className="size-5 animate-spin" />
            {t('documents.loading')}
          </div>
        ) : visibleWorksheets.length ? (
          <div className={cx(
            'mt-5',
            viewMode === 'cards'
              ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
              : 'flex flex-col gap-3',
          )}>
            {visibleWorksheets.map((worksheet) => {
              const isBusy = busyId === worksheet.id;
              return (
                <article
                  key={worksheet.id}
                  className={cx(
                    'group relative rounded-xl border border-secondary bg-primary shadow-xs transition duration-150 hover:border-primary hover:shadow-lg',
                    openMenuId === worksheet.id && 'z-30',
                    viewMode === 'cards'
                      ? 'hover:-translate-y-0.5'
                      : 'grid grid-cols-[9rem_minmax(0,1fr)] sm:grid-cols-[12rem_minmax(0,1fr)]',
                  )}
                >
                  <a
                    href={`/editor?worksheet=${encodeURIComponent(worksheet.id)}`}
                    aria-label={t('documents.openNamed', {
                      title: worksheet.title,
                    })}
                    className={cx(
                      'block',
                      viewMode === 'list' && 'border-r border-secondary',
                    )}
                  >
                    <div className={cx(
                      'relative aspect-video w-full overflow-hidden bg-primary',
                      viewMode === 'cards'
                        ? 'rounded-t-[11px] border-b border-secondary'
                        : 'rounded-l-[11px]',
                    )}>
                      {worksheet.hasPreview ? (
                        <img
                          alt=""
                          src={`/api/worksheets/preview?id=${encodeURIComponent(
                            worksheet.id,
                          )}&v=${encodeURIComponent(
                            worksheet.previewUpdatedAt ?? worksheet.updatedAt,
                          )}`}
                          className="absolute inset-0 block size-full max-w-none object-cover transition duration-200 group-hover:scale-[1.015]"
                        />
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center text-quaternary">
                          <span className="flex size-12 items-center justify-center rounded-full bg-primary shadow-xs ring-1 ring-secondary">
                            <File02 className="size-6 text-fg-quaternary" />
                          </span>
                        </div>
                      )}
                    </div>
                  </a>

                  <div className={cx(
                    'p-4',
                    viewMode === 'list'
                      && 'flex min-w-0 flex-col justify-center',
                  )}>
                    <div className="flex items-start gap-3">
                      <a
                        href={`/editor?worksheet=${encodeURIComponent(worksheet.id)}`}
                        className="min-w-0 flex-1"
                      >
                        <h2 className="truncate text-sm font-semibold text-primary group-hover:text-brand-secondary">
                          {worksheet.title}
                        </h2>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-quaternary">
                          <Clock className="size-3.5" />
                          {t('documents.updatedShort', {
                            date: formatUpdatedAt(worksheet.updatedAt, locale),
                          })}
                        </div>
                      </a>
                      <details
                        className="relative"
                        onToggle={(event) => {
                          setOpenMenuId(event.currentTarget.open
                            ? worksheet.id
                            : (current) => (
                              current === worksheet.id ? null : current
                            ));
                        }}
                      >
                        <summary
                          aria-label={t('documents.actions')}
                          className="flex size-8 cursor-pointer list-none items-center justify-center rounded-md text-fg-quaternary transition hover:bg-primary_hover hover:text-fg-secondary [&::-webkit-details-marker]:hidden"
                        >
                          {isBusy
                            ? <Loading01 className="size-4 animate-spin" />
                            : <DotsVertical className="size-5" />}
                        </summary>
                        <div className="absolute right-0 top-9 z-20 w-60 rounded-lg border border-secondary bg-primary p-1.5 shadow-lg">
                          <a
                            href={`/editor?worksheet=${encodeURIComponent(worksheet.id)}`}
                            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
                          >
                            <Edit05 className="size-4 text-fg-quaternary" />
                            {t('documents.openEditor')}
                          </a>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void duplicateWorksheet(worksheet)}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-semibold text-secondary hover:bg-primary_hover disabled:opacity-50"
                          >
                            <Copy01 className="size-4 text-fg-quaternary" />
                            {t('documents.duplicate')}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={(event) => {
                              event.currentTarget
                                .closest('details')
                                ?.removeAttribute('open');
                              setMoveDialog({
                                worksheet,
                                destinationId: worksheet.folderId,
                              });
                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-semibold text-secondary hover:bg-primary_hover disabled:opacity-50"
                          >
                            <Folder className="size-4 text-fg-quaternary" />
                            {t('documents.moveTo')}
                          </button>
                          <div className="my-1 border-t border-secondary" />
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void deleteWorksheet(worksheet)}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-semibold text-error-primary hover:bg-error-primary disabled:opacity-50"
                          >
                            <Trash01 className="size-4" />
                            {t('common.delete')}
                          </button>
                        </div>
                      </details>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-primary bg-primary px-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <File02 className="size-6 text-fg-quaternary" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-primary">
              {worksheets.length || childFolders.length
                ? t('documents.noResultsTitle')
                : t('documents.emptyTitle')}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-tertiary">
              {worksheets.length || childFolders.length
                ? t('documents.noResultsDescription')
                : t('documents.emptyDescription')}
            </p>
            {!worksheets.length && (
              <Button
                className="mt-5"
                isDisabled={creating}
                iconLeading={<Plus className="size-4" />}
                onPress={() => void createWorksheet()}
              >
                {t('documents.newWorksheet')}
              </Button>
            )}
          </div>
        )}
      </div>

      {folderDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingFolder) {
              setFolderDialog(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="folder-dialog-title"
            className="w-full max-w-md rounded-xl border border-secondary bg-primary p-5 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary">
                <Folder className="size-5 text-fg-brand-primary" />
              </span>
              <div>
                <h2
                  id="folder-dialog-title"
                  className="text-lg font-semibold text-primary"
                >
                  {folderDialog.mode === 'create'
                    ? t('documents.createFolder')
                    : t('documents.renameFolder')}
                </h2>
                <p className="mt-1 text-sm text-tertiary">
                  {folderDialog.mode === 'create'
                    ? t('documents.createFolderDescription')
                    : t('documents.renameFolderDescription')}
                </p>
              </div>
            </div>
            <label className="mt-5 block text-sm font-semibold text-secondary">
              {t('documents.folderName')}
              <input
                autoFocus
                value={folderName}
                maxLength={120}
                onChange={(event) => setFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void saveFolder();
                  if (event.key === 'Escape' && !savingFolder) {
                    setFolderDialog(null);
                  }
                }}
                className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm text-primary shadow-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                color="secondary"
                isDisabled={savingFolder}
                onPress={() => setFolderDialog(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                isDisabled={savingFolder || !folderName.trim()}
                iconLeading={savingFolder
                  ? <Loading01 className="size-4 animate-spin" />
                  : undefined}
                onPress={() => void saveFolder()}
              >
                {folderDialog.mode === 'create'
                  ? t('documents.createFolder')
                  : t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {moveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyId) {
              setMoveDialog(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-dialog-title"
            className="flex max-h-[min(38rem,calc(100vh-2rem))] w-full max-w-md flex-col rounded-xl border border-secondary bg-primary shadow-xl"
          >
            <div className="border-b border-secondary p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary">
                  <Folder className="size-5 text-fg-brand-primary" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="move-dialog-title"
                    className="text-lg font-semibold text-primary"
                  >
                    {t('documents.moveWorksheet')}
                  </h2>
                  <p className="mt-1 truncate text-sm text-tertiary">
                    {moveDialog.worksheet.title}
                  </p>
                </div>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto p-3">
              {[
                {
                  id: null,
                  name: t('documents.libraryRoot'),
                  depth: 0,
                },
                ...folderOptions,
              ].map((folder) => {
                const selected = moveDialog.destinationId === folder.id;
                return (
                  <button
                    type="button"
                    key={folder.id ?? 'root'}
                    onClick={() => setMoveDialog((current) => (
                      current
                        ? { ...current, destinationId: folder.id }
                        : current
                    ))}
                    className={cx(
                      'flex w-full items-center gap-3 rounded-lg py-2.5 pr-3 text-left transition',
                      selected
                        ? 'bg-brand-primary text-brand-secondary'
                        : 'text-secondary hover:bg-primary_hover',
                    )}
                    style={{ paddingLeft: `${12 + folder.depth * 20}px` }}
                  >
                    {folder.id === null
                      ? <HomeLine className="size-5 shrink-0" />
                      : <Folder className="size-5 shrink-0" />}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {folder.name}
                    </span>
                    <span className={cx(
                      'size-2.5 shrink-0 rounded-full border',
                      selected
                        ? 'border-brand-solid bg-brand-solid'
                        : 'border-primary',
                    )} />
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 border-t border-secondary p-4">
              <Button
                color="secondary"
                isDisabled={Boolean(busyId)}
                onPress={() => setMoveDialog(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                isDisabled={
                  Boolean(busyId)
                  || moveDialog.destinationId === moveDialog.worksheet.folderId
                }
                iconLeading={busyId
                  ? <Loading01 className="size-4 animate-spin" />
                  : undefined}
                onPress={() => void moveWorksheet(
                  moveDialog.worksheet,
                  moveDialog.destinationId,
                ).then((moved) => {
                  if (moved) setMoveDialog(null);
                })}
              >
                {t('documents.move')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
