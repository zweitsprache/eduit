"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { germanVerbExceptionRuns } from '@/lib/german-verb-forms';

export type PossessivePronounCaseKey = 'nom' | 'akk' | 'dat' | 'gen';
export type PossessivePronounGenderKey = 'masculine' | 'neuter' | 'feminine' | 'plural';
export type PossessivePronounPersonKey =
  | 'ich'
  | 'du'
  | 'er'
  | 'sie'
  | 'es'
  | 'wir'
  | 'ihr'
  | 'siePlural';

export type PossessivePronounGenderRow = {
  gender: PossessivePronounGenderKey;
  values: Record<PossessivePronounPersonKey, string>;
  additional: string;
};

export type PossessivePronounCaseRow = {
  key: PossessivePronounCaseKey;
  genders: PossessivePronounGenderRow[];
};

export type PossessivePronounAttrs = {
  rows: PossessivePronounCaseRow[];
  displayedCases: PossessivePronounCaseKey[];
};

export const POSSESSIVE_PRONOUN_CASES: Array<{
  key: PossessivePronounCaseKey;
  label: string;
}> = [
  { key: 'nom', label: 'NOMINATIV' },
  { key: 'akk', label: 'AKKUSATIV' },
  { key: 'dat', label: 'DATIV' },
  { key: 'gen', label: 'GENITIV' },
];

export const POSSESSIVE_PRONOUN_GENDERS: Array<{
  key: PossessivePronounGenderKey;
  label: string;
}> = [
  { key: 'masculine', label: 'der' },
  { key: 'neuter', label: 'das' },
  { key: 'feminine', label: 'die' },
  { key: 'plural', label: 'die PLURAL' },
];

export const POSSESSIVE_PRONOUN_PERSONS: Array<{
  key: PossessivePronounPersonKey;
  label: string;
}> = [
  { key: 'ich', label: 'ich' },
  { key: 'du', label: 'du' },
  { key: 'er', label: 'er' },
  { key: 'sie', label: 'sie' },
  { key: 'es', label: 'es' },
  { key: 'wir', label: 'wir' },
  { key: 'ihr', label: 'ihr' },
  { key: 'siePlural', label: 'sie' },
];

const BASE_FORMS: Record<PossessivePronounPersonKey, string> = {
  ich: 'mein',
  du: 'dein',
  er: 'sein',
  sie: 'ihr',
  es: 'sein',
  wir: 'unser',
  ihr: 'euer',
  siePlural: 'ihr',
};

const ENDINGS: Record<
  PossessivePronounCaseKey,
  Record<PossessivePronounGenderKey, string>
> = {
  nom: { masculine: '', neuter: '', feminine: 'e', plural: 'e' },
  akk: { masculine: 'en', neuter: '', feminine: 'e', plural: 'e' },
  dat: { masculine: 'em', neuter: 'em', feminine: 'er', plural: 'en' },
  gen: { masculine: 'es', neuter: 'es', feminine: 'er', plural: 'er' },
};

function inflectPossessive(
  person: PossessivePronounPersonKey,
  ending: string,
) {
  const base = BASE_FORMS[person];
  if (person === 'ihr' && ending) return `eur${ending}`;
  return `${base}${ending}`;
}

function defaultRows(): PossessivePronounCaseRow[] {
  return POSSESSIVE_PRONOUN_CASES.map(({ key }) => ({
    key,
    genders: POSSESSIVE_PRONOUN_GENDERS.map(({ key: gender }) => ({
      gender,
      additional: '',
      values: POSSESSIVE_PRONOUN_PERSONS.reduce((values, { key: person }) => {
        values[person] = inflectPossessive(person, ENDINGS[key][gender]);
        return values;
      }, {} as Record<PossessivePronounPersonKey, string>),
    })),
  }));
}

export const DEFAULT_POSSESSIVE_PRONOUN_ATTRS: PossessivePronounAttrs = {
  rows: defaultRows(),
  displayedCases: POSSESSIVE_PRONOUN_CASES.map(({ key }) => key),
};

function parseDisplayedCases(value: string | null): PossessivePronounCaseKey[] {
  if (!value) return [...DEFAULT_POSSESSIVE_PRONOUN_ATTRS.displayedCases];
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return [...DEFAULT_POSSESSIVE_PRONOUN_ATTRS.displayedCases];
    return POSSESSIVE_PRONOUN_CASES
      .map(({ key }) => key)
      .filter((key) => parsed.includes(key));
  } catch {
    return [...DEFAULT_POSSESSIVE_PRONOUN_ATTRS.displayedCases];
  }
}

function parseRows(value: string | null): PossessivePronounCaseRow[] {
  if (!value) return defaultRows();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultRows();
    const fallback = defaultRows();
    return POSSESSIVE_PRONOUN_CASES.map(({ key }, caseIndex) => {
      const sourceCase = parsed.find((row) => row?.key === key);
      return {
        key,
        genders: POSSESSIVE_PRONOUN_GENDERS.map(({ key: gender }, genderIndex) => {
          const sourceGender = sourceCase?.genders?.find(
            (row: { gender?: unknown }) => row?.gender === gender,
          );
          return {
            gender,
            additional: typeof sourceGender?.additional === 'string'
              ? sourceGender.additional
              : '',
            values: POSSESSIVE_PRONOUN_PERSONS.reduce((values, { key: person }) => {
              const sourceValue = sourceGender?.values?.[person];
              values[person] = typeof sourceValue === 'string'
                ? sourceValue
                : fallback[caseIndex].genders[genderIndex].values[person];
              return values;
            }, {} as Record<PossessivePronounPersonKey, string>),
          };
        }),
      };
    });
  } catch {
    return defaultRows();
  }
}

function renderPossessiveValue(value: string, nominativeValue: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) return '\u00A0';
  return germanVerbExceptionRuns(normalizedValue, nominativeValue.trim()).map((run, index) => (
    run.different
      ? (
        <strong
          className="possessive-pronoun-node__highlight"
          key={index}
        >
          {run.text}
        </strong>
      )
      : <span key={index}>{run.text}</span>
  ));
}

function PossessivePronounNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as PossessivePronounAttrs;
  const rows = attrs.rows?.length ? attrs.rows : defaultRows();
  const displayedCases = attrs.displayedCases
    ?? DEFAULT_POSSESSIVE_PRONOUN_ATTRS.displayedCases;
  const nominativeRow = rows.find((row) => row.key === 'nom');

  return (
    <CustomBlockRoot selected={selected} className="possessive-pronoun-node">
      <div className="possessive-pronoun-node__scroller">
        <table className="possessive-pronoun-node__table">
          <colgroup>
            <col className="possessive-pronoun-node__label-column" />
            {POSSESSIVE_PRONOUN_PERSONS.map(({ key }) => <col key={key} />)}
            <col />
          </colgroup>
          {POSSESSIVE_PRONOUN_CASES
            .filter(({ key }) => displayedCases.includes(key))
            .map(({ key, label }) => {
              const caseRow = rows.find((row) => row.key === key);
              return (
                <tbody key={key}>
                  <tr className="possessive-pronoun-node__case-header">
                    <th scope="col">
                      <span className="possessive-pronoun-node__cell-content">{label}</span>
                    </th>
                    {POSSESSIVE_PRONOUN_PERSONS.map(({ key: person, label: personLabel }) => (
                      <th key={person} scope="col">
                        <span className="possessive-pronoun-node__cell-content">{personLabel}</span>
                      </th>
                    ))}
                    <th aria-label="Leere Zusatzspalte" scope="col">
                      <span className="possessive-pronoun-node__cell-content" />
                    </th>
                  </tr>
                  {POSSESSIVE_PRONOUN_GENDERS.map(({ key: gender, label: genderLabel }) => {
                    const genderRow = caseRow?.genders.find((row) => row.gender === gender);
                    return (
                      <tr key={`${key}-${gender}`}>
                        <th scope="row">
                          <span className="possessive-pronoun-node__cell-content">
                            {gender === 'plural'
                              ? <>die{'\u00A0'}<sup>PLURAL</sup></>
                              : genderLabel}
                          </span>
                        </th>
                        {POSSESSIVE_PRONOUN_PERSONS.map(({ key: person }) => (
                          <td key={person}>
                            <span className="possessive-pronoun-node__cell-content">
                              {key === 'nom'
                                ? (genderRow?.values[person] || '\u00A0')
                                : renderPossessiveValue(
                                  genderRow?.values[person] ?? '',
                                  nominativeRow?.genders.find(
                                    (row) => row.gender === gender,
                                  )?.values[person] ?? '',
                                )}
                            </span>
                          </td>
                        ))}
                        <td aria-label="Leere Zusatzspalte">
                          <span className="possessive-pronoun-node__cell-content">
                            {genderRow?.additional || '\u00A0'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
        </table>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    possessivePronoun: {
      insertPossessivePronoun: (
        attrs?: Partial<PossessivePronounAttrs>,
      ) => ReturnType;
    };
  }
}

export const PossessivePronoun = Node.create({
  name: 'possessivePronoun',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      rows: {
        default: DEFAULT_POSSESSIVE_PRONOUN_ATTRS.rows,
        parseHTML: (element) => parseRows(
          element.getAttribute('data-possessive-pronoun-rows'),
        ),
        renderHTML: ({ rows }) => ({
          'data-possessive-pronoun-rows': encodeURIComponent(JSON.stringify(rows)),
        }),
      },
      displayedCases: {
        default: DEFAULT_POSSESSIVE_PRONOUN_ATTRS.displayedCases,
        parseHTML: (element) => parseDisplayedCases(
          element.getAttribute('data-possessive-pronoun-displayed-cases'),
        ),
        renderHTML: ({ displayedCases }) => ({
          'data-possessive-pronoun-displayed-cases': encodeURIComponent(
            JSON.stringify(displayedCases),
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="possessive-pronoun"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'possessive-pronoun',
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PossessivePronounNodeView);
  },

  addCommands() {
    return {
      insertPossessivePronoun: (attrs = {}) => ({ commands }) => (
        commands.insertContent({
          type: this.name,
          attrs: {
            ...DEFAULT_POSSESSIVE_PRONOUN_ATTRS,
            ...attrs,
            rows: attrs.rows ?? defaultRows(),
            displayedCases: attrs.displayedCases
              ?? [...DEFAULT_POSSESSIVE_PRONOUN_ATTRS.displayedCases],
          },
        })
      ),
    };
  },
});