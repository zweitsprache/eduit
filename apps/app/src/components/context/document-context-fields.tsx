"use client";

import { SearchSelect } from '@/components/base/select/select';
import type { WorksheetContext } from '@/lib/worksheet-types';

const LEARNER_STAGE_OPTIONS = [
  ['early-childhood', 'Frühförderung'],
  ['primary', 'Primarschule'],
  ['lower-secondary', 'Sekundarstufe I'],
  ['upper-secondary', 'Sekundarstufe II'],
  ['vocational', 'Berufsbildung'],
  ['higher-education', 'Hochschule'],
  ['adult-education', 'Erwachsenenbildung'],
  ['professional-training', 'Weiterbildung'],
  ['mixed', 'Gemischte Altersgruppen'],
  ['not-education-specific', 'Nicht bildungsspezifisch'],
] as const;

const SUBJECT_OPTIONS = [
  { value: 'daz', label: 'Deutsch als Zweitsprache (DaZ)' },
  { value: 'additional-languages', label: 'Sprachen' },
  { value: 'arts', label: 'Kunst' },
  { value: 'biology', label: 'Biologie' },
  { value: 'chemistry', label: 'Chemie' },
  { value: 'civics', label: 'Politische Bildung' },
  { value: 'computer-science', label: 'Informatik' },
  { value: 'economics', label: 'Wirtschaft' },
  { value: 'general-science', label: 'Naturwissenschaften' },
  { value: 'geography', label: 'Geografie' },
  { value: 'history', label: 'Geschichte' },
  { value: 'language-arts', label: 'Sprache / Literacy' },
  { value: 'mathematics', label: 'Mathematik' },
  { value: 'music', label: 'Musik' },
  { value: 'physical-education', label: 'Sport' },
  { value: 'physics', label: 'Physik' },
  { value: 'social-studies', label: 'Gesellschaft' },
  { value: 'vocational', label: 'Berufskunde' },
  { value: 'other', label: 'Anderes' },
];

const AGE_GROUP_OPTIONS = [
  ['children', 'Kinder'],
  ['youth', 'Jugendliche'],
  ['adults', 'Erwachsene'],
  ['seniors', 'Senioren'],
] as const;

const CONTENT_LANGUAGE_OPTIONS = [
  ['de-CH', 'Deutsch für die Schweiz'],
  ['de-DE', 'Deutsch (Deutschland) · de-DE'],
  ['de-AT', 'Deutsch (Österreich) · de-AT'],
  ['en', 'Englisch · en'],
] as const;

const LANGUAGE_PROFICIENCY_OPTIONS = [
  'A1.1',
  'A1.2',
  'A1+',
  'A2.1',
  'A2.2',
  'A2+',
  'B1.1',
  'B1.2',
  'B1+',
] as const;

const ACTION_COMPETENCY_OPTIONS = [
  'Lesen',
  'Leseverstehen',
  'Hören',
  'Hörverstehen',
  'Monologisches Sprechen',
  'Dialogisches Sprechen',
  'Monologisches Schreiben',
  'Dialogisches Schreiben',
] as const;

const LANGUAGE_COMPETENCY_OPTIONS = [
  'Wortschatz',
  'Grammatik',
  'Aussprache',
  'Intonation',
  'Orthografie',
] as const;

const ACTION_FIELD_OPTIONS = [
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

const inputClass =
  'mt-1.5 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

export function DocumentContextFields({
  context,
  expandMoreContext = false,
  onChange,
  twoColumns = false,
}: {
  context: WorksheetContext;
  expandMoreContext?: boolean;
  onChange: (patch: Partial<WorksheetContext>) => void;
  twoColumns?: boolean;
}) {
  void expandMoreContext;
  return (
    <div className={twoColumns ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
      <label className="block text-xs font-semibold text-tertiary">
        Arbeitsblatttyp
        <select
          value={context.worksheetType}
          onChange={(event) => onChange({
            worksheetType: event.target.value as WorksheetContext['worksheetType'],
          })}
          className={inputClass}
        >
          <option value="worksheet">Arbeitsblatt</option>
          <option value="fact-sheet">Merkblatt</option>
          <option value="verb-table">Verbtabelle</option>
          <option value="declension-table">Deklinationstabelle</option>
          <option value="communication-cards">Kommunikationskarten</option>
          <option value="learning-cards">Lernkarten</option>
          <option value="information-gap">Wechselspiel</option>
          <option value="domino">Domino</option>
          <option value="dialog">Dialog</option>
          <option value="word-list">Wörterliste</option>
        </select>
      </label>
      <label className="block text-xs font-semibold text-tertiary">
        Fach
        <span className="mt-1.5 block font-normal">
          <SearchSelect
            ariaLabel="Subject"
            value={context.subject}
            placeholder="Fach auswählen"
            options={SUBJECT_OPTIONS}
            onChange={(subject) => onChange({
              subject,
              customSubject: subject === 'other' ? context.customSubject : '',
            })}
          />
        </span>
      </label>
      {context.subject === 'other' && (
        <label className="block text-xs font-semibold text-tertiary">
          Anderes Fach
          <input
            type="text"
            value={context.customSubject}
            placeholder="Fach eingeben"
            onChange={(event) => onChange({
              customSubject: event.target.value,
            })}
            className={inputClass}
          />
        </label>
      )}
      <label className="block text-xs font-semibold text-tertiary">
        Bildungsstufe
        <select
          value={context.learnerStage}
          onChange={(event) => onChange({ learnerStage: event.target.value })}
          className={inputClass}
        >
          <option value="">Nicht angegeben</option>
          {LEARNER_STAGE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-xs font-semibold text-tertiary">
          Altersgruppe
        </legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {AGE_GROUP_OPTIONS.map(([value, label]) => {
            const selected = context.ageGroups.includes(value);
            return (
              <label
                className="flex items-center gap-2 rounded-md border border-primary bg-primary px-2.5 py-2 text-sm font-medium text-secondary"
                key={value}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...context.ageGroups, value]
                      : context.ageGroups.filter((item) => item !== value);
                    onChange({ ageGroups: [...new Set(next)] });
                  }}
                />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <label className="block text-xs font-semibold text-tertiary">
        Inhaltssprache
        <select
          value={context.contentLanguage}
          onChange={(event) => onChange({
            contentLanguage: event.target.value,
          })}
          className={inputClass}
        >
          {CONTENT_LANGUAGE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <div className={`${twoColumns ? 'col-span-2' : ''} pt-3`}>
        <div className={twoColumns
          ? 'grid grid-cols-2 gap-3'
          : 'space-y-3'}
        >
          <label className="block text-xs font-semibold text-tertiary">
            Sprachniveau
            <select
              value={context.languageLevel}
              onChange={(event) => onChange({ languageLevel: event.target.value })}
              className={inputClass}
            >
              <option value="">Nicht angegeben</option>
              {LANGUAGE_PROFICIENCY_OPTIONS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          {(context.subject === 'daz' || context.subject === 'additional-languages') && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-tertiary">
                Sprachhandlungskompetenz
              </legend>
              <div className="mt-1.5 space-y-2">
                {ACTION_COMPETENCY_OPTIONS.map((value) => (
                  <label className="flex items-center gap-2 text-sm text-secondary" key={value}>
                    <input
                      checked={context.actionCompetencies.includes(value)}
                      onChange={() => {
                        const next = context.actionCompetencies.includes(value)
                          ? context.actionCompetencies.filter((item) => item !== value)
                          : [...context.actionCompetencies, value];
                        onChange({ actionCompetencies: next });
                      }}
                      type="checkbox"
                    />
                    {value}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {(context.subject === 'daz' || context.subject === 'additional-languages') && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-tertiary">
                Sprachkompetenz
              </legend>
              <div className="mt-1.5 space-y-2">
                {LANGUAGE_COMPETENCY_OPTIONS.map((value) => (
                  <label className="flex items-center gap-2 text-sm text-secondary" key={value}>
                    <input
                      checked={context.languageCompetencies.includes(value)}
                      onChange={() => {
                        const next = context.languageCompetencies.includes(value)
                          ? context.languageCompetencies.filter((item) => item !== value)
                          : [...context.languageCompetencies, value];
                        onChange({ languageCompetencies: next });
                      }}
                      type="checkbox"
                    />
                    {value}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {(context.subject === 'daz' || context.subject === 'additional-languages') && (
            <label className="block text-xs font-semibold text-tertiary">
              Handlungsfeld
              <select
                value={context.actionField}
                onChange={(event) => onChange({ actionField: event.target.value })}
                className={inputClass}
              >
                <option value="">Nicht angegeben</option>
                {ACTION_FIELD_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
          )}
          <label className={`${twoColumns ? 'col-span-2' : ''} block text-xs font-semibold text-tertiary`}>
            Lernkontext
            <textarea
              rows={3}
              value={context.learnerContext}
              placeholder="Relevante Bedürfnisse, Vorwissen oder Lernsituation"
              onChange={(event) => onChange({
                learnerContext: event.target.value,
              })}
              className={`${inputClass} resize-y`}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
