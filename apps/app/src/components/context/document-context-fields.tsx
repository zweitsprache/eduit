"use client";

import { SearchSelect } from '@/components/base/select/select';
import type { WorksheetContext } from '@/lib/worksheet-types';

const LEARNER_STAGE_OPTIONS = [
  ['early-childhood', 'Early childhood'],
  ['primary', 'Primary education'],
  ['lower-secondary', 'Lower secondary'],
  ['upper-secondary', 'Upper secondary'],
  ['vocational', 'Vocational education'],
  ['higher-education', 'Higher education'],
  ['adult-education', 'Adult education'],
  ['professional-training', 'Professional training'],
  ['mixed', 'Mixed ages'],
  ['not-education-specific', 'Not education-specific'],
] as const;

const SUBJECT_OPTIONS = [
  { value: 'additional-languages', label: 'Languages' },
  { value: 'arts', label: 'Arts' },
  { value: 'biology', label: 'Biology' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'civics', label: 'Civics' },
  { value: 'computer-science', label: 'Computer science' },
  { value: 'economics', label: 'Economics' },
  { value: 'general-science', label: 'General science' },
  { value: 'geography', label: 'Geography' },
  { value: 'history', label: 'History' },
  { value: 'language-arts', label: 'Language arts / Literacy' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'music', label: 'Music' },
  { value: 'physical-education', label: 'Physical education' },
  { value: 'physics', label: 'Physics' },
  { value: 'social-studies', label: 'Social studies' },
  { value: 'vocational', label: 'Vocational studies' },
  { value: 'other', label: 'Other' },
];

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
  return (
    <div className={twoColumns ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
      <label className="block text-xs font-semibold text-tertiary">
        Subject
        <span className="mt-1.5 block font-normal">
          <SearchSelect
            ariaLabel="Subject"
            value={context.subject}
            placeholder="Search subjects"
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
          Other subject
          <input
            type="text"
            value={context.customSubject}
            placeholder="Enter the subject"
            onChange={(event) => onChange({
              customSubject: event.target.value,
            })}
            className={inputClass}
          />
        </label>
      )}
      <label className="block text-xs font-semibold text-tertiary">
        Learner stage
        <select
          value={context.learnerStage}
          onChange={(event) => onChange({ learnerStage: event.target.value })}
          className={inputClass}
        >
          <option value="">Not specified</option>
          {LEARNER_STAGE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-xs font-semibold text-tertiary">
          Typical age range
        </legend>
        <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <input
            aria-label="Minimum learner age"
            type="number"
            min={0}
            max={120}
            value={context.ageMin ?? ''}
            placeholder="Min"
            onChange={(event) => onChange({
              ageMin: event.target.value === ''
                ? null
                : Math.min(120, Math.max(0, Number(event.target.value))),
            })}
            className={`${inputClass} mt-0 min-w-0 px-2.5`}
          />
          <span className="text-xs text-quaternary">to</span>
          <input
            aria-label="Maximum learner age"
            type="number"
            min={0}
            max={120}
            value={context.ageMax ?? ''}
            placeholder="Max"
            onChange={(event) => onChange({
              ageMax: event.target.value === ''
                ? null
                : Math.min(120, Math.max(0, Number(event.target.value))),
            })}
            className={`${inputClass} mt-0 min-w-0 px-2.5`}
          />
        </div>
      </fieldset>
      <label className="block text-xs font-semibold text-tertiary">
        Content language
        <input
          type="text"
          value={context.contentLanguage}
          placeholder="e.g. German (de-CH)"
          onChange={(event) => onChange({
            contentLanguage: event.target.value,
          })}
          className={inputClass}
        />
      </label>
      <details
        className={`${twoColumns ? 'col-span-2' : ''} border-t border-secondary pt-3`}
        open={expandMoreContext || undefined}
      >
        <summary className="cursor-pointer text-xs font-semibold text-secondary">
          More context
        </summary>
        <div className={twoColumns
          ? 'mt-3 grid grid-cols-2 gap-3'
          : 'mt-3 space-y-3'}
        >
          {([
            ['country', 'Country / education system', 'e.g. Switzerland'],
            ['localLevel', 'Local level', 'e.g. Sekundarstufe I'],
            ['curriculum', 'Curriculum', 'Name or curriculum code'],
            ['languageLevel', 'Language proficiency', 'e.g. CEFR A2'],
          ] as const).map(([key, label, placeholder]) => (
            <label
              className="block text-xs font-semibold text-tertiary"
              key={key}
            >
              {label}
              <input
                type="text"
                value={context[key]}
                placeholder={placeholder}
                onChange={(event) => onChange({ [key]: event.target.value })}
                className={inputClass}
              />
            </label>
          ))}
          <label className={`${twoColumns ? 'col-span-2' : ''} block text-xs font-semibold text-tertiary`}>
            Learner context
            <textarea
              rows={3}
              value={context.learnerContext}
              placeholder="Relevant needs, prior knowledge, or learning situation"
              onChange={(event) => onChange({
                learnerContext: event.target.value,
              })}
              className={`${inputClass} resize-y`}
            />
          </label>
        </div>
      </details>
    </div>
  );
}
