'use client';

const worksheetTypes = [
  'Arbeitsblatt',
  'Merkblatt',
  'Verbtabelle',
  'Deklinationstabelle',
  'Kommunikationskarten',
  'Lernkarten',
  'Wechselspiel',
  'Domino',
  'Dialog',
  'Wörterliste',
  'Leseverstehen',
] as const;

const actionFields = [
  'Deutschkurs',
  'Gesundheit',
  'Sicherheit und Notfälle',
  'Familie und Partnerschaft',
  'Kinder und Schule',
  'Soziales Netz',
  'Beratung und Unterstützung',
  'Einkaufen',
  'Ernährung',
  'Wohnen',
  'Mobilität',
  'Finanzen und Versicherungen',
  'Behörden',
  'Freizeit und Hobbys',
  'Kultur und Identität',
  'Arbeit',
  'Arbeitssuche',
  'Umwelt und Klima',
  'Technologie',
  'Weiterbildung',
] as const;

export function FilterSidebar({
  onActionCompetencyChange,
  onActionFieldChange,
  onLanguageCompetencyChange,
  onLevelChange,
  onTypeChange,
  selectedActionCompetencies,
  selectedActionFields,
  selectedLanguageCompetencies,
  selectedLevels,
  selectedTypes,
  typeCounts,
  actionFieldCounts,
}: {
  onTypeChange: (type: string, checked: boolean) => void;
  onLevelChange: (level: string, checked: boolean) => void;
  onActionCompetencyChange: (competency: string, checked: boolean) => void;
  onActionFieldChange: (actionField: string, checked: boolean) => void;
  onLanguageCompetencyChange: (competency: string, checked: boolean) => void;
  selectedLevels: string[];
  selectedActionCompetencies: string[];
  selectedActionFields: string[];
  selectedLanguageCompetencies: string[];
  selectedTypes: string[];
  typeCounts: Record<string, number>;
  actionFieldCounts: Record<string, number>;
}) {
  return (
    <aside className="filters">
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
          Kursprogression variieren. Tipp: Brauchen Sie auch in den
          Nachbarniveaus Ihres aktuellen Kursniveaus.
        </p>
      </div>
      <div className="filter-group">
        <h3>Handlungsfeld</h3>
        {actionFields.map((actionField) => (
          <label key={actionField}>
            <input
              checked={selectedActionFields.includes(actionField)}
              onChange={(event) => onActionFieldChange(
                actionField,
                event.target.checked,
              )}
              type="checkbox"
            />
            <span>{actionField}</span>
            <small>{actionFieldCounts[actionField] || 0}</small>
          </label>
        ))}
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
    </aside>
  );
}
