'use client';

import { useMemo, useState } from 'react';
import { Grid01, List } from '@untitledui/icons';
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

  const updateSelection = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    checked: boolean,
  ) => setter((current) => (
    checked ? [...current, value] : current.filter((item) => item !== value)
  ));

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
          {visibleWorksheets.map((worksheet) => (
            <WorksheetCard
              deleting={deletingId === worksheet.worksheetId}
              key={worksheet.slug}
              onDelete={deleteWorksheet}
              worksheet={worksheet}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
