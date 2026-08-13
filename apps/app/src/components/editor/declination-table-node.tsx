"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { germanVerbExceptionRuns } from '@/lib/german-verb-forms';

export type DeclinationCaseKey = 'nom' | 'akk' | 'dat' | 'gen';
export type DeclinationGenderKey = 'masculine' | 'feminine' | 'neuter' | 'plural';
export type DeclinationFormIndex = 0 | 1 | 2;

export type DeclinationTriplet = {
  article: [string, string, string];
  adjective: [string, string, string];
  noun: [string, string, string];
};

export type DeclinationCaseRow = {
  key: DeclinationCaseKey;
  values: Record<DeclinationGenderKey, DeclinationTriplet>;
};

export type DeclinationBaseForms = Record<DeclinationGenderKey, string>;

export type DeclinationTableAttrs = {
  rows: DeclinationCaseRow[];
  baseAdjectives: DeclinationBaseForms;
  baseNouns: DeclinationBaseForms;
};

const FORM_INDICES: DeclinationFormIndex[] = [0, 1, 2];

const CASE_LABELS: Record<DeclinationCaseKey, string> = {
  nom: 'NOMINATIV',
  akk: 'AKKUSATIV',
  dat: 'DATIV',
  gen: 'GENITIV',
};

const CASE_KEYS: DeclinationCaseKey[] = ['nom', 'akk', 'dat', 'gen'];

const GENDER_LABELS: Array<{ key: DeclinationGenderKey; label: string }> = [
  { key: 'masculine', label: 'maskulin' },
  { key: 'neuter', label: 'neutral' },
  { key: 'feminine', label: 'feminin' },
  { key: 'plural', label: 'plural' },
];

const ADJECTIVE_DIFF_BASE: Record<DeclinationGenderKey, string> = {
  masculine: 'rot',
  neuter: 'grün',
  feminine: 'gelb',
  plural: 'weiss',
};

const DECLENSION_ENDINGS = ['em', 'en', 'er', 'es', 'e'] as const;

function defaultBaseAdjectives(): DeclinationBaseForms {
  return {
    masculine: ADJECTIVE_DIFF_BASE.masculine,
    feminine: ADJECTIVE_DIFF_BASE.feminine,
    neuter: ADJECTIVE_DIFF_BASE.neuter,
    plural: ADJECTIVE_DIFF_BASE.plural,
  };
}

function defaultBaseNouns(): DeclinationBaseForms {
  return {
    masculine: 'Rock',
    feminine: 'Bluse',
    neuter: 'Hemd',
    plural: 'Schuhe',
  };
}

function adjectiveBaseCandidates(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const candidates = new Set<string>([trimmed]);
  DECLENSION_ENDINGS.forEach((ending) => {
    if (trimmed.length <= ending.length || !trimmed.endsWith(ending)) return;
    const stripped = trimmed.slice(0, -ending.length);
    if (!stripped) return;
    candidates.add(stripped);
    if (stripped.endsWith('l') || stripped.endsWith('r')) {
      candidates.add(`${stripped.slice(0, -1)}e${stripped.slice(-1)}`);
    }
  });
  return [...candidates];
}

function inferBaseFromForms(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    adjectiveBaseCandidates(value).forEach((candidate) => {
      counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || right[0].length - left[0].length)[0]?.[0]
    ?? '';
}

function inferBaseForms(
  rows: DeclinationCaseRow[],
  field: keyof DeclinationTriplet,
) {
  return GENDER_LABELS.reduce((result, { key }) => {
    const values = rows.flatMap((row) => row.values[key][field]).filter(Boolean);
    result[key] = field === 'noun'
      ? rows.find((row) => row.key === 'nom')?.values[key].noun[0].trim() ?? ''
      : inferBaseFromForms(values);
    return result;
  }, {} as DeclinationBaseForms);
}

function resolveBaseForms(
  provided: DeclinationBaseForms | undefined,
  defaults: DeclinationBaseForms,
  inferred: DeclinationBaseForms,
) {
  return GENDER_LABELS.reduce((result, { key }) => {
    const current = provided?.[key]?.trim() ?? '';
    result[key] = current && current !== defaults[key]
      ? current
      : inferred[key] || current || defaults[key];
    return result;
  }, {} as DeclinationBaseForms);
}

function defaultRows(): DeclinationCaseRow[] {
  return [
    {
      key: 'nom',
      values: {
        masculine: {
          article: ['der', 'ein', ''],
          adjective: ['rote', 'roter', 'roter'],
          noun: ['Rock', 'Rock', 'Rock'],
        },
        feminine: {
          article: ['die', 'eine', ''],
          adjective: ['gelbe', 'gelbe', 'gelbe'],
          noun: ['Bluse', 'Bluse', 'Bluse'],
        },
        neuter: {
          article: ['das', 'ein', ''],
          adjective: ['grüne', 'grünes', 'grünes'],
          noun: ['Hemd', 'Hemd', 'Hemd'],
        },
        plural: {
          article: ['die', '', ''],
          adjective: ['weissen', 'weisse', 'weisse'],
          noun: ['Schuhe', 'Schuhe', 'Schuhe'],
        },
      },
    },
    {
      key: 'akk',
      values: {
        masculine: {
          article: ['den', 'einen', ''],
          adjective: ['roten', 'roten', 'roten'],
          noun: ['Rock', 'Rock', 'Rock'],
        },
        feminine: {
          article: ['die', 'eine', ''],
          adjective: ['gelbe', 'gelbe', 'gelbe'],
          noun: ['Bluse', 'Bluse', 'Bluse'],
        },
        neuter: {
          article: ['das', 'ein', ''],
          adjective: ['grüne', 'grünes', 'grünes'],
          noun: ['Hemd', 'Hemd', 'Hemd'],
        },
        plural: {
          article: ['die', '', ''],
          adjective: ['weissen', 'weisse', 'weisse'],
          noun: ['Schuhe', 'Schuhe', 'Schuhe'],
        },
      },
    },
    {
      key: 'dat',
      values: {
        masculine: {
          article: ['dem', 'einem', ''],
          adjective: ['roten', 'roten', 'rotem'],
          noun: ['Rock', 'Rock', 'Rock'],
        },
        feminine: {
          article: ['der', 'einer', ''],
          adjective: ['gelben', 'gelben', 'gelber'],
          noun: ['Bluse', 'Bluse', 'Bluse'],
        },
        neuter: {
          article: ['dem', 'einem', ''],
          adjective: ['grünen', 'grünen', 'grünem'],
          noun: ['Hemd', 'Hemd', 'Hemd'],
        },
        plural: {
          article: ['den', '', ''],
          adjective: ['weissen', 'weissen', 'weissen'],
          noun: ['Schuhen', 'Schuhen', 'Schuhen'],
        },
      },
    },
    {
      key: 'gen',
      values: {
        masculine: {
          article: ['des', 'eines', ''],
          adjective: ['roten', 'roten', 'roten'],
          noun: ['Rocks', 'Rocks', 'Rocks'],
        },
        feminine: {
          article: ['der', 'einer', ''],
          adjective: ['gelben', 'gelben', 'gelber'],
          noun: ['Bluse', 'Bluse', 'Bluse'],
        },
        neuter: {
          article: ['des', 'eines', ''],
          adjective: ['grünen', 'grünen', 'grünen'],
          noun: ['Hemds', 'Hemds', 'Hemds'],
        },
        plural: {
          article: ['der', '', ''],
          adjective: ['weissen', 'weisser', 'weisser'],
          noun: ['Schuhe', 'Schuhe', 'Schuhe'],
        },
      },
    },
  ];
}

export const DEFAULT_DECLINATION_TABLE_ATTRS: DeclinationTableAttrs = {
  rows: defaultRows(),
  baseAdjectives: defaultBaseAdjectives(),
  baseNouns: defaultBaseNouns(),
};

function parseBaseForms(
  value: string | null,
  fallback: DeclinationBaseForms,
) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!parsed || typeof parsed !== 'object') return fallback;
    return GENDER_LABELS.reduce((result, { key }) => {
      const current = parsed[key];
      result[key] = typeof current === 'string' && current.trim()
        ? current.trim()
        : fallback[key];
      return result;
    }, {} as DeclinationBaseForms);
  } catch {
    return fallback;
  }
}

function parseRows(value: string | null) {
  if (!value) return defaultRows();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultRows();
    return parsed.flatMap((row): DeclinationCaseRow[] => {
      if (
        !row
        || typeof row !== 'object'
        || !['nom', 'akk', 'dat', 'gen'].includes(String(row.key))
      ) {
        return [];
      }
      const values = row.values as Partial<Record<DeclinationGenderKey, Partial<DeclinationTriplet>>>;
      const normalized = GENDER_LABELS.reduce(
        (result, { key }) => {
          const source = values?.[key] ?? {};
          const normalizeLegacyUmlautValue = (part: string) => {
            switch (part) {
              case 'grun':
                return 'grün';
              case 'grune':
                return 'grüne';
              case 'grunes':
                return 'grünes';
              case 'grunen':
                return 'grünen';
              case 'grunem':
                return 'grünem';
              default:
                return part;
            }
          };
          const normalize = (parts: unknown) => {
            if (!Array.isArray(parts)) return ['', '', ''] as [string, string, string];
            return [0, 1, 2].map((index) => {
              const part = parts[index];
              return typeof part === 'string'
                ? normalizeLegacyUmlautValue(part)
                : '';
            }) as [string, string, string];
          };
          result[key] = {
            article: normalize(source.article),
            adjective: normalize(source.adjective),
            noun: normalize(source.noun),
          };
          return result;
        },
        {} as Record<DeclinationGenderKey, DeclinationTriplet>,
      );
      return [{
        key: row.key as DeclinationCaseKey,
        values: normalized,
      }];
    });
  } catch {
    return defaultRows();
  }
}

function renderValue(values: [string, string, string], index: DeclinationFormIndex) {
  const value = values[index].trim();
  return value || '\u00A0';
}

function renderNounValue(
  values: [string, string, string],
  index: DeclinationFormIndex,
  baselineOverride?: string,
) {
  return renderDiffValue(
    values,
    index,
    'declination-table-node__highlight--noun',
    baselineOverride,
    true,
  );
}

function renderAdjectiveValue(
  values: [string, string, string],
  index: DeclinationFormIndex,
  baseAdjective: string,
) {
  return renderDiffValue(
    values,
    index,
    'declination-table-node__highlight--adjective',
    baseAdjective,
    true,
  );
}

function renderDiffValue(
  values: [string, string, string],
  index: DeclinationFormIndex,
  toneClassName: string,
  baselineOverride?: string,
  includeFirstForm = false,
) {
  const value = values[index].trim();
  if (!value) return '\u00A0';

  const base = (baselineOverride ?? values[0]).trim();
  if (!base || (!includeFirstForm && index === 0)) return value;

  const runs = germanVerbExceptionRuns(value, base);
  return runs.map((run, runIndex) => (
    run.different
      ? (
        <strong
          className={`declination-table-node__highlight declination-table-node__highlight--diff ${toneClassName}`}
          key={runIndex}
        >
          {run.text}
        </strong>
      )
      : <span key={runIndex}>{run.text}</span>
  ));
}

function CaseHeaderRow({
  rowKey,
  sectionLabel,
}: {
  rowKey: string;
  sectionLabel?: string;
}) {
  return (
    <div className="declination-table-node__header-row" role="row">
      <div className="declination-table-node__header-cell declination-table-node__header-cell--corner" role="columnheader">
        {sectionLabel ?? '\u00A0'}
      </div>
      {CASE_KEYS.map((caseKey) => (
        <div
          className="declination-table-node__header-cell declination-table-node__header-cell--case"
          key={`${rowKey}-${caseKey}`}
          style={{ gridColumn: 'span 3' }}
          role="columnheader"
        >
          {CASE_LABELS[caseKey]}
        </div>
      ))}
    </div>
  );
}

function DeclinationTableNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as DeclinationTableAttrs;
  const rows = (attrs.rows?.length ? attrs.rows : defaultRows())
    .filter((row) => CASE_KEYS.includes(row.key));
  const inferredBaseAdjectives = inferBaseForms(rows, 'adjective');
  const inferredBaseNouns = inferBaseForms(rows, 'noun');
  const baseAdjectives = resolveBaseForms(
    attrs.baseAdjectives,
    defaultBaseAdjectives(),
    inferredBaseAdjectives,
  );
  const baseNouns = resolveBaseForms(
    attrs.baseNouns,
    defaultBaseNouns(),
    inferredBaseNouns,
  );
  const rowByCase = new Map(rows.map((row) => [row.key, row]));

  return (
    <CustomBlockRoot selected={selected} className="declination-table-node">
      <div className="declination-table-node__grid" role="table">
        <CaseHeaderRow rowKey="header-top" sectionLabel="SINGULAR" />

        {GENDER_LABELS.flatMap(({ key: genderKey, label }) => (
          [
            ...(genderKey === 'plural'
              ? [
                <CaseHeaderRow
                  key="header-plural"
                  rowKey="header-plural"
                  sectionLabel="PLURAL"
                />,
              ]
              : []),
            ...FORM_INDICES.map((formIndex) => (
              <div
                className="declination-table-node__body-row"
                data-gender={genderKey}
                data-form-index={formIndex}
                key={`${genderKey}-${formIndex}`}
                role="row"
              >
                <div className="declination-table-node__cell declination-table-node__cell--gender" role="rowheader">
                  {formIndex === 0
                    ? (genderKey === 'plural' ? '\u00A0' : label)
                    : '\u00A0'}
                </div>
                {CASE_KEYS.map((caseKey) => {
                  const caseRow = rowByCase.get(caseKey);
                  const triplet = caseRow?.values[genderKey];
                  const nominativeTriplet = rowByCase.get('nom')?.values[genderKey];
                  if (!triplet) return null;
                  return (
                    <span className="declination-table-node__cell-group" key={`${genderKey}-${formIndex}-${caseKey}`}>
                      <div className="declination-table-node__cell" data-case={caseKey} role="cell">
                        {renderValue(triplet.article, formIndex)}
                      </div>
                      <div className="declination-table-node__cell" data-case={caseKey} role="cell">
                        {renderAdjectiveValue(
                          triplet.adjective,
                          formIndex,
                          baseAdjectives[genderKey],
                        )}
                      </div>
                      <div className="declination-table-node__cell" data-case={caseKey} role="cell">
                        {renderNounValue(
                          triplet.noun,
                          formIndex,
                          baseNouns[genderKey] || nominativeTriplet?.noun[0],
                        )}
                      </div>
                    </span>
                  );
                })}
              </div>
            )),
          ]
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    declinationTable: {
      insertDeclinationTable: (
        attrs?: Partial<DeclinationTableAttrs>,
      ) => ReturnType;
    };
  }
}

export const DeclinationTable = Node.create({
  name: 'declinationTable',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      rows: {
        default: DEFAULT_DECLINATION_TABLE_ATTRS.rows,
        parseHTML: (element) => parseRows(
          element.getAttribute('data-declination-rows'),
        ),
        renderHTML: ({ rows }) => ({
          'data-declination-rows': encodeURIComponent(
            JSON.stringify(rows),
          ),
        }),
      },
      baseAdjectives: {
        default: DEFAULT_DECLINATION_TABLE_ATTRS.baseAdjectives,
        parseHTML: (element) => parseBaseForms(
          element.getAttribute('data-declination-base-adjectives'),
          defaultBaseAdjectives(),
        ),
        renderHTML: ({ baseAdjectives }) => ({
          'data-declination-base-adjectives': encodeURIComponent(
            JSON.stringify(baseAdjectives),
          ),
        }),
      },
      baseNouns: {
        default: DEFAULT_DECLINATION_TABLE_ATTRS.baseNouns,
        parseHTML: (element) => parseBaseForms(
          element.getAttribute('data-declination-base-nouns'),
          defaultBaseNouns(),
        ),
        renderHTML: ({ baseNouns }) => ({
          'data-declination-base-nouns': encodeURIComponent(
            JSON.stringify(baseNouns),
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="declination-table"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'declination-table',
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DeclinationTableNodeView);
  },

  addCommands() {
    return {
      insertDeclinationTable: (attrs = {}) => ({ commands }) => (
        commands.insertContent({
          type: this.name,
          attrs: {
            ...DEFAULT_DECLINATION_TABLE_ATTRS,
            ...attrs,
            rows: attrs.rows ?? defaultRows(),
            baseAdjectives: attrs.baseAdjectives ?? defaultBaseAdjectives(),
            baseNouns: attrs.baseNouns ?? defaultBaseNouns(),
          },
        })
      ),
    };
  },
});
