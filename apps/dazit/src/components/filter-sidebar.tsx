'use client';

const worksheetTypes = [
  'Arbeitsblatt',
  'Merkblatt',
  'Verbtabelle',
  'Deklinationstabelle',
  'Kommunikationskarten',
  'Lernkarten',
  'Domino',
  'Dialog',
  'Leseverstehen',
] as const;

const groups = [
  ['Schwierigkeit', ['Basic', 'Intermediate', 'Advanced'], ['9', '4', '3']],
  ['Seitenzahl', ['1–4', '5–8', '9+'], ['4', '7', '5']],
] as const;

export function FilterSidebar({
  onActionCompetencyChange,
  onLanguageCompetencyChange,
  onLevelChange,
  onTypeChange,
  selectedActionCompetencies,
  selectedLanguageCompetencies,
  selectedLevels,
  selectedTypes,
  typeCounts,
}: {
  onTypeChange: (type: string, checked: boolean) => void;
  onLevelChange: (level: string, checked: boolean) => void;
  onActionCompetencyChange: (competency: string, checked: boolean) => void;
  onLanguageCompetencyChange: (competency: string, checked: boolean) => void;
  selectedLevels: string[];
  selectedActionCompetencies: string[];
  selectedLanguageCompetencies: string[];
  selectedTypes: string[];
  typeCounts: Record<string, number>;
}) {
  return (
    <aside className="filters">
      <h2>Filter</h2>
      <div className="filter-group">
        <h3>Niveau</h3>
        <div className="filter-options-two-cols">
          {['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'].map((level) => (
            <label key={level}>
              <input
                checked={selectedLevels.includes(level)}
                onChange={(event) => onLevelChange(level, event.target.checked)}
                type="checkbox"
              />
              <span>{level}</span>
            </label>
          ))}
        </div>
        <p className="filter-help">
          Die Niveau-Zuordnungen sind approximativ und können je nach
          Kursprogression variieren. Tipp: Suchen Sie auch in den
          Nachbarniveaus Ihres aktuellen Kursniveaus.
        </p>
      </div>
      <div className="filter-group">
        <h3>Sprachhandlungskompetenz</h3>
        {[
          'Lesen',
          'Hören',
          'Monologisches Sprechen',
          'Dialogisches Sprechen',
          'Monologisches Schreiben',
          'Dialogisches Schreiben',
        ].map((competency) => (
          <label key={competency}>
            <input
              checked={selectedActionCompetencies.includes(competency)}
              onChange={(event) => onActionCompetencyChange(
                competency,
                event.target.checked,
              )}
              type="checkbox"
            />
            <span>{competency}</span>
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Sprachkompetenz</h3>
        {[
          'Wortschatz',
          'Grammatik',
          'Aussprache',
          'Intonation',
          'Orthografie',
        ].map((competency) => (
          <label key={competency}>
            <input
              checked={selectedLanguageCompetencies.includes(competency)}
              onChange={(event) => onLanguageCompetencyChange(
                competency,
                event.target.checked,
              )}
              type="checkbox"
            />
            <span>{competency}</span>
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Typ</h3>
        {worksheetTypes.map((type) => (
          <label key={type}>
            <input
              checked={selectedTypes.includes(type)}
              onChange={(event) => onTypeChange(type, event.target.checked)}
              type="checkbox"
            />
            <span>{type}</span>
            <small>{typeCounts[type] || 0}</small>
          </label>
        ))}
      </div>
      {groups.map(([title, options, counts]) => (
        <div className="filter-group" key={title}>
          <h3>{title}</h3>
          {options.map((option, index) => (
            <label key={option}>
              <input type="checkbox" />
              <span>{option}</span>
              <small>{counts[index]}</small>
            </label>
          ))}
        </div>
      ))}
      <div className="filter-group">
        <h3>Hinzugefügt</h3>
        {['Jederzeit', 'Letzte 30 Tage', 'Letzte 3 Monate', 'Dieses Jahr'].map((option, index) => (
          <label key={option}>
            <input defaultChecked={index === 0} name="date" type="radio" />
            <span>{option}</span>
            <small>{[16, 9, 14, 16][index]}</small>
          </label>
        ))}
      </div>
      <label className="toggle-row">
        <input type="checkbox" />
        <span aria-hidden="true" />
        Mit Lösungsblatt
      </label>
      <div className="popular-tags">
        <h3>Beliebte Tags</h3>
        <div>{['vocabulary', 'game', 'reading', 'grammar', 'fractions', 'phonics', 'geometry', 'numbers'].map((tag) => <button key={tag}>{tag}</button>)}</div>
      </div>
    </aside>
  );
}
