'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download01, Grid01, List, SearchLg, XClose } from '@untitledui/icons';
import { FilterSidebar } from '@/components/filter-sidebar';
import { WorksheetCard } from '@/components/worksheet-card';
import type { Worksheet } from '@/lib/worksheets';
import { trackSearch } from '@/components/search-tracking-form';
import { useDazitViewer } from '@/lib/auth/use-dazit-viewer';

type SortMode = 'relevance' | 'newest' | 'popular' | 'title';

const EMPTY_FILTERS: string[] = [];

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('de-CH')
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .replaceAll('ae', 'a')
    .replaceAll('oe', 'o')
    .replaceAll('ue', 'u')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function worksheetSearchScore(worksheet: Worksheet, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const terms = normalizedQuery.split(/\s+/);
  const title = normalizeSearchText(worksheet.title);
  const tags = normalizeSearchText(worksheet.tags.join(' '));
  const actionField = normalizeSearchText(worksheet.actionField || '');
  const metadata = normalizeSearchText([
    worksheet.documentType,
    worksheet.level,
    worksheet.language,
    ...worksheet.actionCompetencies || [],
    ...worksheet.languageCompetencies || [],
  ].filter(Boolean).join(' '));
  const supportingText = normalizeSearchText([
    worksheet.description,
    worksheet.searchSnippet,
  ].filter(Boolean).join(' '));
  const searchableText = [title, tags, actionField, metadata, supportingText].join(' ');

  if (!terms.every((term) => searchableText.includes(term))) return null;

  let score = 0;
  if (title === normalizedQuery) score += 1000;
  else if (title.startsWith(normalizedQuery)) score += 600;
  else if (title.includes(normalizedQuery)) score += 400;
  if (tags.split(' ').includes(normalizedQuery)) score += 300;
  if (actionField === normalizedQuery) score += 300;
  for (const term of terms) {
    if (title.includes(term)) score += 80;
    if (tags.includes(term)) score += 45;
    if (actionField.includes(term)) score += 45;
    if (metadata.includes(term)) score += 25;
    if (supportingText.includes(term)) score += 10;
  }
  return score;
}

export function LibraryBrowser({
  canAdminister,
  isAuthenticated,
  initialActionFields = EMPTY_FILTERS,
  initialLevels = EMPTY_FILTERS,
  initialQuery = '',
  initialTypes = EMPTY_FILTERS,
  worksheets,
}: {
  canAdminister?: boolean;
  isAuthenticated?: boolean;
  initialActionFields?: string[];
  initialLevels?: string[];
  initialQuery?: string;
  initialTypes?: string[];
  worksheets: Worksheet[];
}) {
  const viewer = useDazitViewer();
  const resolvedCanAdminister = canAdminister ?? Boolean(viewer?.isAdmin);
  const resolvedIsAuthenticated = isAuthenticated ?? Boolean(viewer?.authenticated);
  const [libraryWorksheets, setLibraryWorksheets] = useState(worksheets);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(initialLevels);
  const [selectedActionCompetencies, setSelectedActionCompetencies] = useState<string[]>([]);
  const [selectedLanguageCompetencies, setSelectedLanguageCompetencies] = useState<string[]>([]);
  const [selectedActionFields, setSelectedActionFields] = useState<string[]>(
    initialActionFields,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sortMode, setSortMode] = useState<SortMode>(initialQuery ? 'relevance' : 'newest');
  const [downloadingResults, setDownloadingResults] = useState(false);

  useEffect(() => {
    setSelectedTypes(initialTypes);
    setSelectedLevels(initialLevels);
    setSelectedActionFields(initialActionFields);
    setCurrentPage(1);
  }, [initialActionFields, initialTypes, initialLevels]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 720px)');
    const updatePageSize = () => {
      setPageSize(mediaQuery.matches ? 6 : 12);
      setCurrentPage(1);
    };
    updatePageSize();
    mediaQuery.addEventListener('change', updatePageSize);
    return () => mediaQuery.removeEventListener('change', updatePageSize);
  }, []);
  useEffect(() => {
    if (!filtersOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [filtersOpen]);

  useEffect(() => {
    const openFilters = () => setFiltersOpen(true);
    window.addEventListener('dazit:open-filters', openFilters);
    return () => window.removeEventListener('dazit:open-filters', openFilters);
  }, []);
  const typeCounts = useMemo(() => libraryWorksheets.reduce<Record<string, number>>(
    (counts, worksheet) => ({
      ...counts,
      [worksheet.documentType]: (counts[worksheet.documentType] || 0) + 1,
    }),
    {},
  ), [libraryWorksheets]);
  const actionFieldCounts = useMemo(() => libraryWorksheets.reduce<Record<string, number>>(
    (counts, worksheet) => worksheet.actionField
      ? {
        ...counts,
        [worksheet.actionField]: (counts[worksheet.actionField] || 0) + 1,
      }
      : counts,
    {},
  ), [libraryWorksheets]);
  const visibleWorksheets = libraryWorksheets
    .map((worksheet, index) => ({
      index,
      score: worksheetSearchScore(worksheet, initialQuery),
      worksheet,
    }))
    .filter(({ score, worksheet }) => (
      score !== null
      && (!selectedTypes.length || selectedTypes.includes(worksheet.documentType))
      && (!selectedLevels.length || (
        worksheet.level ? selectedLevels.includes(worksheet.level) : false
      ))
      && (!selectedActionFields.length || (
        worksheet.actionField
          ? selectedActionFields.includes(worksheet.actionField)
          : false
      ))
      && (!selectedActionCompetencies.length || selectedActionCompetencies.some(
        (competency) => worksheet.actionCompetencies?.includes(competency),
      ))
      && (!selectedLanguageCompetencies.length || selectedLanguageCompetencies.some(
        (competency) => worksheet.languageCompetencies?.includes(competency),
      ))
    ))
    .sort((left, right) => {
      if (sortMode === 'relevance') return (right.score || 0) - (left.score || 0) || left.index - right.index;
      if (sortMode === 'popular') return Number(right.worksheet.downloads) - Number(left.worksheet.downloads) || left.index - right.index;
      if (sortMode === 'title') return left.worksheet.title.localeCompare(right.worksheet.title, 'de-CH');
      return left.index - right.index;
    })
    .map(({ worksheet }) => worksheet);
  const pageCount = Math.max(1, Math.ceil(visibleWorksheets.length / pageSize));
  const activePage = Math.min(currentPage, pageCount);
  const paginatedWorksheets = visibleWorksheets.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );

  useEffect(() => {
    if (initialQuery.trim().length < 2) return;
    trackSearch(initialQuery, visibleWorksheets.length, {
      levels: selectedLevels,
      types: selectedTypes,
    });
  // Track the query once when arriving on the results page (including homepage searches).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const updateSelection = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    checked: boolean,
  ) => {
    setCurrentPage(1);
    setter((current) => (
      checked ? [...current, value] : current.filter((item) => item !== value)
    ));
  };

  const deleteWorksheet = async (worksheet: Worksheet) => {
    if (!worksheet.worksheetId || !window.confirm(
      `«${worksheet.title}» wirklich aus Dazit löschen?`,
    )) return;
    setDeletingId(worksheet.worksheetId);
    try {
      const response = await fetch(
        `/api/publications/${encodeURIComponent(worksheet.worksheetId)}`,
        { method: 'DELETE' },
      );
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || 'Löschen fehlgeschlagen.');
      setLibraryWorksheets((current) => current.filter(
        ({ worksheetId }) => worksheetId !== worksheet.worksheetId,
      ));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Löschen fehlgeschlagen.');
    } finally {
      setDeletingId(null);
    }
  };

  const downloadResults = async () => {
    setDownloadingResults(true);
    try {
      const response = await fetch('/api/admin/download-results', {
        body: JSON.stringify({ slugs: visibleWorksheets.map(({ slug }) => slug) }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (!response.ok) throw new Error('Download fehlgeschlagen.');
      const blobUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = response.headers.get('content-disposition')
        ?.match(/filename="([^"]+)"/)?.[1] ?? 'dazit-suchergebnisse.zip';
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.alert('Die ZIP-Datei konnte nicht erstellt werden. Bitte versuchen Sie es erneut.');
    } finally {
      setDownloadingResults(false);
    }
  };

  return (
    <main className="library-layout">
      <button
        aria-label="Filter schließen"
        className={`mobile-filter-backdrop${filtersOpen ? ' is-open' : ''}`}
        onClick={() => setFiltersOpen(false)}
        tabIndex={filtersOpen ? 0 : -1}
        type="button"
      />
      <div
        className={`filter-drawer${filtersOpen ? ' is-open' : ''}`}
        id="mobile-filters"
      >
        <div className="mobile-filter-header">
          <strong>Filter</strong>
          <button aria-label="Filter schließen" onClick={() => setFiltersOpen(false)} type="button">
            <XClose />
          </button>
        </div>
        <FilterSidebar
          selectedTypes={selectedTypes}
          selectedLevels={selectedLevels}
          selectedActionCompetencies={selectedActionCompetencies}
          selectedActionFields={selectedActionFields}
          selectedLanguageCompetencies={selectedLanguageCompetencies}
          typeCounts={typeCounts}
          actionFieldCounts={actionFieldCounts}
          onTypeChange={(value, checked) => updateSelection(setSelectedTypes, value, checked)}
          onLevelChange={(value, checked) => updateSelection(setSelectedLevels, value, checked)}
          onActionCompetencyChange={(value, checked) => updateSelection(
            setSelectedActionCompetencies,
            value,
            checked,
          )}
          onActionFieldChange={(value, checked) => updateSelection(
            setSelectedActionFields,
            value,
            checked,
          )}
          onLanguageCompetencyChange={(value, checked) => updateSelection(
            setSelectedLanguageCompetencies,
            value,
            checked,
          )}
        />
        <button className="mobile-filter-apply" onClick={() => setFiltersOpen(false)} type="button">
          {visibleWorksheets.length} Ergebnisse anzeigen
        </button>
      </div>
      <section className="library-results">
        <form action="/documents" className="mobile-search documents-search" method="get" onSubmit={(event) => {
          const form = event.currentTarget;
          const query = String(new FormData(form).get('q') || '');
          const resultCount = libraryWorksheets.filter((worksheet) => (
            (!selectedTypes.length || selectedTypes.includes(worksheet.documentType))
            && (!selectedLevels.length || (worksheet.level ? selectedLevels.includes(worksheet.level) : false))
            && worksheetSearchScore(worksheet, query) !== null
          )).length;
          trackSearch(query, resultCount, {
            levels: selectedLevels,
            types: selectedTypes,
          });
        }}>
          <SearchLg aria-hidden="true" />
          <input name="q" defaultValue={initialQuery} placeholder="Titel oder Stichwort suchen …" aria-label="Bibliothek durchsuchen" />
        </form>
        <div className="results-toolbar">
          <strong>{visibleWorksheets.length} Ergebnisse</strong>
          <div>
            {resolvedCanAdminister && (
              <button
                className="download-results-button"
                disabled={downloadingResults || visibleWorksheets.length === 0}
                onClick={downloadResults}
                title="Alle Suchergebnisse als ZIP herunterladen"
                type="button"
              >
                <Download01 aria-hidden="true" />
                <span>{downloadingResults ? 'ZIP wird erstellt …' : 'Alle PDFs'}</span>
              </button>
            )}
            <select
              aria-label="Sortierung"
              onChange={(event) => { setSortMode(event.target.value as SortMode); setCurrentPage(1); }}
              value={sortMode}
            >
              <option value="relevance">Relevanteste zuerst</option>
              <option value="newest">Neueste zuerst</option>
              <option value="popular">Beliebteste zuerst</option>
              <option value="title">Titel A–Z</option>
            </select>
            <button className="view-active" aria-label="Rasteransicht"><Grid01 /></button>
            <button aria-label="Listenansicht"><List /></button>
          </div>
        </div>
        <div className="worksheet-grid">
          {paginatedWorksheets.map((worksheet) => (
            <WorksheetCard
              canDownload={resolvedIsAuthenticated}
              deleting={deletingId === worksheet.worksheetId}
              key={worksheet.slug}
              onDelete={resolvedCanAdminister ? deleteWorksheet : undefined}
              worksheet={worksheet}
            />
          ))}
        </div>
        {pageCount > 1 && (
          <nav className="pagination" aria-label="Seitennavigation">
            <button
              disabled={activePage === 1}
              onClick={() => setCurrentPage(1)}
              type="button"
            >
              Erste
            </button>
            <button
              disabled={activePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              Zurück
            </button>
            <span>{activePage} / {pageCount}</span>
            <button
              disabled={activePage === pageCount}
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              type="button"
            >
              Weiter
            </button>
            <button
              disabled={activePage === pageCount}
              onClick={() => setCurrentPage(pageCount)}
              type="button"
            >
              Letzte
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
