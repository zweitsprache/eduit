'use client';

import { useEffect, useMemo, useState } from 'react';
import { Grid01, List, XClose } from '@untitledui/icons';
import { FilterSidebar } from '@/components/filter-sidebar';
import { WorksheetCard } from '@/components/worksheet-card';
import type { Worksheet } from '@/lib/worksheets';

export function LibraryBrowser({
  initialLevels = [],
  initialQuery = '',
  initialTypes = [],
  worksheets,
}: {
  initialLevels?: string[];
  initialQuery?: string;
  initialTypes?: string[];
  worksheets: Worksheet[];
}) {
  const [libraryWorksheets, setLibraryWorksheets] = useState(worksheets);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(initialLevels);
  const [selectedActionCompetencies, setSelectedActionCompetencies] = useState<string[]>([]);
  const [selectedLanguageCompetencies, setSelectedLanguageCompetencies] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

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
  const normalizedQuery = initialQuery.trim().toLocaleLowerCase('de-CH');
  const visibleWorksheets = libraryWorksheets.filter((worksheet) => (
    (!selectedTypes.length || selectedTypes.includes(worksheet.documentType))
    && (!selectedLevels.length || (
      worksheet.level ? selectedLevels.includes(worksheet.level) : false
    ))
    && (!selectedActionCompetencies.length || selectedActionCompetencies.some(
      (competency) => worksheet.actionCompetencies?.includes(competency),
    ))
    && (!selectedLanguageCompetencies.length || selectedLanguageCompetencies.some(
      (competency) => worksheet.languageCompetencies?.includes(competency),
    ))
    && (!normalizedQuery || [
      worksheet.title,
      worksheet.description,
      ...worksheet.tags,
    ].join(' ').toLocaleLowerCase('de-CH').includes(normalizedQuery))
  ));
  const pageCount = Math.max(1, Math.ceil(visibleWorksheets.length / pageSize));
  const activePage = Math.min(currentPage, pageCount);
  const paginatedWorksheets = visibleWorksheets.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );

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
          selectedLanguageCompetencies={selectedLanguageCompetencies}
          typeCounts={typeCounts}
          onTypeChange={(value, checked) => updateSelection(setSelectedTypes, value, checked)}
          onLevelChange={(value, checked) => updateSelection(setSelectedLevels, value, checked)}
          onActionCompetencyChange={(value, checked) => updateSelection(
            setSelectedActionCompetencies,
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
        <div className="results-toolbar">
          <strong>{visibleWorksheets.length} Ergebnisse</strong>
          <div>
            <select aria-label="Sortierung" defaultValue="newest">
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
              deleting={deletingId === worksheet.worksheetId}
              key={worksheet.slug}
              onDelete={deleteWorksheet}
              worksheet={worksheet}
            />
          ))}
        </div>
        {pageCount > 1 && (
          <nav className="pagination" aria-label="Seitennavigation">
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
          </nav>
        )}
      </section>
    </main>
  );
}
