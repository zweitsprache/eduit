"use client";

import type { ReactNode } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import {
  buildGermanVerbReferenceForms,
  firstPersonAuxiliary,
  germanVerbExceptionRuns,
  splitGermanSeparableForm,
  type GermanVerbAuxiliary,
} from '@/lib/german-verb-forms';

export type GermanVerbTableForms = {
  ich: string;
  du: string;
  formalSingular: string;
  thirdSingular: string;
  wir: string;
  ihr: string;
  formalPlural: string;
  thirdPlural: string;
  preteriteIch: string;
};

export type GermanVerbTableStyle = 'extended' | 'compact' | 'multiple';
export type GermanVerbTableMultipleCount = 4 | 5;
export type GermanVerbTableMultipleBadgeStyle = 'light' | 'dark';

export type GermanVerbTableMultipleVerb = {
  verb: string;
  forms: GermanVerbTableForms;
  separablePrefix: string;
};

export type GermanVerbTableAttrs = {
  tableStyle: GermanVerbTableStyle;
  tense: 'present' | 'preterite';
  groupId: string;
  groupIndex: number;
  groupSize: number;
  leftVerb: string;
  leftForms: GermanVerbTableForms;
  leftAuxiliary: string;
  leftParticiple: string;
  comparisonAuxiliary: GermanVerbAuxiliary;
  separablePrefix: string;
  rightVerb: string;
  forms: GermanVerbTableForms;
  rightAuxiliary: string;
  rightParticiple: string;
  multipleVerbCount: GermanVerbTableMultipleCount;
  multipleBadgeStyle: GermanVerbTableMultipleBadgeStyle;
  multipleVerbs: GermanVerbTableMultipleVerb[];
};

export const DEFAULT_GERMAN_VERB_TABLE_ATTRS: GermanVerbTableAttrs = {
  tableStyle: 'extended',
  tense: 'present',
  groupId: '',
  groupIndex: 0,
  groupSize: 1,
  leftVerb: 'sein',
  leftForms: {
    ich: 'bin',
    du: 'bist',
    formalSingular: 'sind',
    thirdSingular: 'ist',
    wir: 'sind',
    ihr: 'seid',
    formalPlural: 'sind',
    thirdPlural: 'sind',
    preteriteIch: 'war',
  },
  leftAuxiliary: 'sein',
  leftParticiple: 'gewesen',
  comparisonAuxiliary: 'haben',
  separablePrefix: '',
  rightVerb: 'haben',
  forms: {
    ich: 'habe',
    du: 'hast',
    formalSingular: 'haben',
    thirdSingular: 'hat',
    wir: 'haben',
    ihr: 'habt',
    formalPlural: 'haben',
    thirdPlural: 'haben',
    preteriteIch: 'hatte',
  },
  rightAuxiliary: 'haben',
  rightParticiple: 'gehabt',
  multipleVerbCount: 5,
  multipleBadgeStyle: 'light',
  multipleVerbs: [
    {
      verb: 'sein',
      forms: {
        ich: 'bin', du: 'bist', formalSingular: 'sind',
        thirdSingular: 'ist', wir: 'sind', ihr: 'seid',
        formalPlural: 'sind', thirdPlural: 'sind', preteriteIch: 'war',
      },
      separablePrefix: '',
    },
    {
      verb: 'haben',
      forms: {
        ich: 'habe', du: 'hast', formalSingular: 'haben',
        thirdSingular: 'hat', wir: 'haben', ihr: 'habt',
        formalPlural: 'haben', thirdPlural: 'haben', preteriteIch: 'hatte',
      },
      separablePrefix: '',
    },
    {
      verb: 'abfahren',
      forms: {
        ich: 'fahre ab', du: 'fährst ab', formalSingular: 'fahren ab',
        thirdSingular: 'fährt ab', wir: 'fahren ab', ihr: 'fahrt ab',
        formalPlural: 'fahren ab', thirdPlural: 'fahren ab',
        preteriteIch: 'fuhr ab',
      },
      separablePrefix: 'ab',
    },
    {
      verb: 'einkaufen',
      forms: {
        ich: 'kaufe ein', du: 'kaufst ein', formalSingular: 'kaufen ein',
        thirdSingular: 'kauft ein', wir: 'kaufen ein', ihr: 'kauft ein',
        formalPlural: 'kaufen ein', thirdPlural: 'kaufen ein',
        preteriteIch: 'kaufte ein',
      },
      separablePrefix: 'ein',
    },
    {
      verb: 'gehen',
      forms: {
        ich: 'gehe', du: 'gehst', formalSingular: 'gehen',
        thirdSingular: 'geht', wir: 'gehen', ihr: 'geht',
        formalPlural: 'gehen', thirdPlural: 'gehen',
        preteriteIch: 'ging',
      },
      separablePrefix: '',
    },
  ],
};

function VerbCell({
  children,
  className = '',
  header = false,
}: {
  children?: ReactNode;
  className?: string;
  header?: boolean;
}) {
  return (
    <div
      className={`german-verb-table-node__cell ${className}`}
      role={header ? 'rowheader' : 'cell'}
    >
      {children}
    </div>
  );
}

function VerbRow({ children }: { children: ReactNode }) {
  return (
    <div className="german-verb-table-node__row" role="row">
      {children}
    </div>
  );
}

function ExceptionDiff({
  actual,
  reference,
}: {
  actual: string;
  reference: string;
}) {
  const runs = germanVerbExceptionRuns(actual, reference);

  return runs.map((run, index) => (
    run.different
      ? (
        <strong
          className="german-verb-table-node__exception"
          key={index}
        >
          {run.text}
        </strong>
      )
      : <span key={index}>{run.text}</span>
  ));
}

function SeparableVerbForm({
  actual,
  reference,
  separablePrefix,
}: {
  actual: string;
  reference: string;
  separablePrefix: string;
}) {
  const normalizedPrefix = separablePrefix.trim();
  if (!normalizedPrefix) {
    return <ExceptionDiff actual={actual} reference={reference} />;
  }
  const prefixWidth = normalizedPrefix.toLocaleLowerCase('de-DE') === 'zurück'
    ? 'long'
    : normalizedPrefix.toLocaleLowerCase('de-DE') === 'nach'
      ? 'medium'
      : 'default';
  const actualParts = splitGermanSeparableForm(actual, normalizedPrefix);
  const referenceParts = splitGermanSeparableForm(reference, normalizedPrefix);

  return (
    <span
      className="german-verb-table-node__separable-value"
      data-prefix-width={prefixWidth}
    >
      <span>
        <ExceptionDiff
          actual={actualParts.base}
          reference={referenceParts.base}
        />
      </span>
      <span>
        <ExceptionDiff
          actual={actualParts.hasPrefix ? normalizedPrefix : ''}
          reference={referenceParts.hasPrefix ? normalizedPrefix : ''}
        />
      </span>
    </span>
  );
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return fallback;
  }
}

const MULTIPLE_FORM_ROWS: Array<{
  key: keyof GermanVerbTableForms;
  number?: 'SINGULAR' | 'PLURAL';
  person?: string;
  personRowSpan?: boolean;
  register?: string;
  pronoun: string;
}> = [
  { key: 'ich', number: 'SINGULAR', person: '1. Person', pronoun: 'ich' },
  {
    key: 'du',
    person: '2. Person',
    personRowSpan: true,
    register: 'informell',
    pronoun: 'du',
  },
  { key: 'formalSingular', register: 'formell', pronoun: 'Sie' },
  { key: 'thirdSingular', person: '3. Person', pronoun: 'er / sie / es' },
  { key: 'wir', number: 'PLURAL', person: '1. Person', pronoun: 'wir' },
  {
    key: 'ihr',
    person: '2. Person',
    personRowSpan: true,
    register: 'informell',
    pronoun: 'ihr',
  },
  { key: 'formalPlural', register: 'formell', pronoun: 'Sie' },
  { key: 'thirdPlural', person: '3. Person', pronoun: 'sie' },
];

function GermanVerbTableNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as GermanVerbTableAttrs;
  const tableStyle = attrs.tableStyle === 'compact'
    || attrs.tableStyle === 'multiple'
    ? attrs.tableStyle
    : 'extended';
  const extended = tableStyle === 'extended';
  const tense = attrs.tense === 'preterite' ? 'preterite' : 'present';
  const tenseLabel = tense === 'preterite' ? 'Präteritum' : 'Präsens';
  const leftForms = {
    ...DEFAULT_GERMAN_VERB_TABLE_ATTRS.leftForms,
    ...attrs.leftForms,
  };
  const separablePrefix = attrs.separablePrefix?.trim() ?? '';
  const referenceForms = buildGermanVerbReferenceForms(
    attrs.leftVerb,
    separablePrefix,
    tense,
  );
  const comparisonAuxiliary = attrs.comparisonAuxiliary === 'sein'
    ? 'sein'
    : 'haben';
  const perfectAuxiliary =
    attrs.leftAuxiliary.trim().toLocaleLowerCase('de-DE') === 'sein'
      ? firstPersonAuxiliary('sein')
      : attrs.leftAuxiliary.trim().toLocaleLowerCase('de-DE') === 'haben'
        ? firstPersonAuxiliary('haben')
        : attrs.leftAuxiliary;
  const referencePerfectAuxiliary =
    firstPersonAuxiliary(comparisonAuxiliary);
  const multipleVerbCount = attrs.multipleVerbCount === 4 ? 4 : 5;
  const multipleVerbs = DEFAULT_GERMAN_VERB_TABLE_ATTRS.multipleVerbs.map(
    (fallback, index) => {
      const value = attrs.multipleVerbs?.[index];
      return {
        ...fallback,
        ...value,
        forms: { ...fallback.forms, ...value?.forms },
      };
    },
  ).slice(0, multipleVerbCount);
  const lastUsedMultipleVerbIndex = multipleVerbs.findLastIndex(
    ({ verb }) => Boolean(verb.trim()),
  );
  const keepWithNext = tableStyle === 'multiple'
    && attrs.groupSize > 1
    && attrs.groupIndex % 2 === 0
    && attrs.groupIndex + 1 < attrs.groupSize;

  return (
    <CustomBlockRoot
      selected={selected}
      className={`german-verb-table-node ${
        keepWithNext ? 'german-verb-table-node--keep-with-next' : ''
      }`}
    >
      {tableStyle === 'multiple' ? (
        <div
          aria-label={`Konjugation von ${multipleVerbCount} Verben`}
          className="german-verb-table-node__multiple-grid"
          data-badge-style={attrs.multipleBadgeStyle === 'dark'
            ? 'dark'
            : 'light'}
          data-verb-count={multipleVerbCount}
          role="table"
        >
          <div
            className="german-verb-table-node__multiple-row german-verb-table-node__multiple-header"
            role="row"
          >
            <VerbCell
              className="german-verb-table-node__multiple-present"
              header
            />
            {multipleVerbs.map((verb, index) => {
              const unused = !verb.verb.trim();
              const followedByUnused = !multipleVerbs[index + 1]?.verb.trim();
              return (
                <VerbCell
                  className={`${unused
                    ? 'german-verb-table-node__multiple-unused'
                    : ''} ${followedByUnused
                    ? 'german-verb-table-node__multiple-before-unused'
                    : ''} ${index === lastUsedMultipleVerbIndex
                    ? 'german-verb-table-node__multiple-last-used'
                    : ''}`}
                  header
                  key={index}
                >
                  {!unused && (
                    <strong className="custom-block__word-bank-item german-verb-table-node__infinitive-badge">
                      {verb.verb}
                    </strong>
                  )}
                </VerbCell>
              );
            })}
          </div>
          {MULTIPLE_FORM_ROWS.map((row) => (
            <div
              className="german-verb-table-node__multiple-row"
              data-number-start={row.number ? 'true' : undefined}
              key={row.key}
              role="row"
            >
              {row.number && (
                <VerbCell
                  className="german-verb-table-node__multiple-number-label"
                  header
                >
                  <span>{row.number}</span>
                </VerbCell>
              )}
              {row.person && (
                <VerbCell
                  className={`german-verb-table-node__multiple-person ${
                    row.personRowSpan
                      ? 'german-verb-table-node__multiple-person--two-rows'
                      : ''
                  }`}
                  header
                >
                  <span>{row.person}</span>
                </VerbCell>
              )}
              {row.register && (
                <VerbCell
                  className="german-verb-table-node__multiple-register"
                  header
                >
                  {row.register}
                </VerbCell>
              )}
              <VerbCell
                className="german-verb-table-node__multiple-pronoun"
                header
              >
                {row.pronoun}
              </VerbCell>
              {multipleVerbs.map((verb, index) => {
                const unused = !verb.verb.trim();
                const followedByUnused = !multipleVerbs[index + 1]?.verb.trim();
                const references = buildGermanVerbReferenceForms(
                  verb.verb,
                  verb.separablePrefix,
                  tense,
                );
                return (
                  <VerbCell
                    className={`german-verb-table-node__form ${
                      unused
                        ? 'german-verb-table-node__multiple-unused'
                        : ''
                    } ${followedByUnused
                      ? 'german-verb-table-node__multiple-before-unused'
                      : ''} ${index === lastUsedMultipleVerbIndex
                      ? 'german-verb-table-node__multiple-last-used'
                      : ''}`}
                    key={index}
                  >
                    {!unused && (
                      <SeparableVerbForm
                        actual={verb.forms[row.key]}
                        reference={references[row.key]}
                        separablePrefix={verb.separablePrefix}
                      />
                    )}
                  </VerbCell>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <>
      <div className="german-verb-table-node__infinitive">
        <strong
          aria-label={`Infinitiv: ${attrs.leftVerb}`}
          className="custom-block__word-bank-item german-verb-table-node__infinitive-badge"
        >
          {attrs.leftVerb}
        </strong>
      </div>
      <div
        aria-label={`Konjugation von ${attrs.leftVerb}`}
        className="german-verb-table-node__grid"
        data-table-style={tableStyle}
        role="table"
      >
        {!extended && (
          <div
            className="german-verb-table-node__compact-header"
            role="row"
          >
            <VerbCell
              className="german-verb-table-node__compact-header-cell german-verb-table-node__compact-header-cell--present"
              header
            >
              {tenseLabel.toLocaleUpperCase('de-CH')}
            </VerbCell>
            <VerbCell
              className="german-verb-table-node__compact-header-cell german-verb-table-node__compact-header-cell--singular"
              header
            >
              SINGULAR
            </VerbCell>
            <VerbCell
              className="german-verb-table-node__compact-header-cell german-verb-table-node__compact-header-cell--plural"
              header
            >
              PLURAL
            </VerbCell>
          </div>
        )}
        <div
          className="german-verb-table-node__present-group german-verb-table-node__present-group--singular"
          role="rowgroup"
        >
          <VerbRow>
            {extended && (
              <>
                <VerbCell className="german-verb-table-node__cell--first-continuous german-verb-table-node__cell--tense" header>
                  {tenseLabel}
                </VerbCell>
                <VerbCell
                  className="german-verb-table-node__cell--first-continuous german-verb-table-node__cell--number"
                  header
                >
                  Singular
                </VerbCell>
              </>
            )}
            <VerbCell className="german-verb-table-node__cell--person-wide" header>
              1. Person
            </VerbCell>
            <VerbCell>ich</VerbCell>
            <VerbCell className="german-verb-table-node__form">
              <SeparableVerbForm
                actual={leftForms.ich}
                reference={referenceForms.ich}
                separablePrefix={separablePrefix}
              />
            </VerbCell>
          </VerbRow>
          <VerbRow>
            {extended && (
              <>
                <VerbCell className="german-verb-table-node__cell--first-continuous" />
                <VerbCell className="german-verb-table-node__cell--first-continuous" />
              </>
            )}
            <VerbCell
              className="german-verb-table-node__cell--second-person"
              header
            >
              2. Person
            </VerbCell>
            <VerbCell className="german-verb-table-node__register">
              informell
            </VerbCell>
            <VerbCell>du</VerbCell>
            <VerbCell className="german-verb-table-node__form">
              <SeparableVerbForm
                actual={leftForms.du}
                reference={referenceForms.du}
                separablePrefix={separablePrefix}
              />
            </VerbCell>
          </VerbRow>
          <VerbRow>
            {extended && (
              <>
                <VerbCell className="german-verb-table-node__cell--first-continuous" />
                <VerbCell className="german-verb-table-node__cell--first-continuous" />
              </>
            )}
            <VerbCell header />
            <VerbCell className="german-verb-table-node__register">
              formell
            </VerbCell>
            <VerbCell>Sie</VerbCell>
            <VerbCell className="german-verb-table-node__form">
              <SeparableVerbForm
                actual={leftForms.formalSingular}
                reference={referenceForms.formalSingular}
                separablePrefix={separablePrefix}
              />
            </VerbCell>
          </VerbRow>
          <VerbRow>
            {extended && (
              <>
                <VerbCell className="german-verb-table-node__cell--first-continuous" />
                <VerbCell />
              </>
            )}
            <VerbCell className="german-verb-table-node__cell--person-wide" header>
              3. Person
            </VerbCell>
            <VerbCell>er / sie / es</VerbCell>
            <VerbCell className="german-verb-table-node__form">
              <SeparableVerbForm
                actual={leftForms.thirdSingular}
                reference={referenceForms.thirdSingular}
                separablePrefix={separablePrefix}
              />
            </VerbCell>
          </VerbRow>
        </div>
        <div className="german-verb-table-node__present-group" role="rowgroup">
          <VerbRow>
            {extended && (
              <>
                <VerbCell className="german-verb-table-node__cell--first-continuous" />
                <VerbCell
                  className="german-verb-table-node__cell--first-continuous german-verb-table-node__cell--number"
                  header
                >
                  Plural
                </VerbCell>
              </>
            )}
            {extended && (
              <VerbCell className="german-verb-table-node__cell--person-wide" header>
                1. Person
              </VerbCell>
            )}
            <VerbCell>wir</VerbCell>
            <VerbCell className="german-verb-table-node__form">
              <SeparableVerbForm
                actual={leftForms.wir}
                reference={referenceForms.wir}
                separablePrefix={separablePrefix}
              />
            </VerbCell>
          </VerbRow>
          <VerbRow>
            {extended && (
              <>
                <VerbCell className="german-verb-table-node__cell--first-continuous" />
                <VerbCell className="german-verb-table-node__cell--first-continuous" />
              </>
            )}
            {extended && (
              <>
                <VerbCell
                  className="german-verb-table-node__cell--second-person"
                  header
                >
                  2. Person
                </VerbCell>
                <VerbCell className="german-verb-table-node__register">
                  informell
                </VerbCell>
              </>
            )}
            <VerbCell>ihr</VerbCell>
            <VerbCell className="german-verb-table-node__form">
              <SeparableVerbForm
                actual={leftForms.ihr}
                reference={referenceForms.ihr}
                separablePrefix={separablePrefix}
              />
            </VerbCell>
          </VerbRow>
          <VerbRow>
            {extended && (
              <>
                <VerbCell className="german-verb-table-node__cell--first-continuous" />
                <VerbCell className="german-verb-table-node__cell--first-continuous" />
              </>
            )}
            {extended && (
              <>
                <VerbCell header />
                <VerbCell className="german-verb-table-node__register">
                  formell
                </VerbCell>
              </>
            )}
            <VerbCell>Sie</VerbCell>
            <VerbCell className="german-verb-table-node__form">
              <SeparableVerbForm
                actual={leftForms.formalPlural}
                reference={referenceForms.formalPlural}
                separablePrefix={separablePrefix}
              />
            </VerbCell>
          </VerbRow>
          <VerbRow>
            {extended && (
              <>
                <VerbCell />
                <VerbCell />
              </>
            )}
            {extended && (
              <VerbCell className="german-verb-table-node__cell--person-wide" header>
                3. Person
              </VerbCell>
            )}
            <VerbCell>sie</VerbCell>
            <VerbCell className="german-verb-table-node__form">
              <SeparableVerbForm
                actual={leftForms.thirdPlural}
                reference={referenceForms.thirdPlural}
                separablePrefix={separablePrefix}
              />
            </VerbCell>
          </VerbRow>
        </div>
        {extended && (
          <>
            <VerbRow>
              <VerbCell
                className="german-verb-table-node__cell--meta-label"
                header
              >
                Perfekt
              </VerbCell>
              <VerbCell
                className="german-verb-table-node__cell--number"
                header
              >
                Singular
              </VerbCell>
              <VerbCell
                className="german-verb-table-node__cell--person-wide"
                header
              >
                1. Person
              </VerbCell>
              <VerbCell>ich</VerbCell>
              <VerbCell className="german-verb-table-node__cell--split-value german-verb-table-node__form">
                <span>
                  <ExceptionDiff
                    actual={perfectAuxiliary}
                    reference={referencePerfectAuxiliary}
                  />
                </span>
                <span>
                  <ExceptionDiff
                    actual={attrs.leftParticiple}
                    reference={referenceForms.participle}
                  />
                </span>
              </VerbCell>
            </VerbRow>
          </>
        )}
      </div>
        </>
      )}
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    germanVerbTable: {
      insertGermanVerbTable: (
        attrs?: Partial<GermanVerbTableAttrs>,
      ) => ReturnType;
    };
  }
}

export const GermanVerbTable = Node.create({
  name: 'germanVerbTable',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      tableStyle: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.tableStyle,
        parseHTML: (element) => {
          const value = element.getAttribute('data-table-style');
          return value === 'compact' || value === 'multiple'
            ? value
            : 'extended';
        },
        renderHTML: ({ tableStyle }) => ({
          'data-table-style': tableStyle,
        }),
      },
      tense: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.tense,
        parseHTML: (element) => (
          element.getAttribute('data-tense') === 'preterite'
            ? 'preterite'
            : 'present'
        ),
        renderHTML: ({ tense }) => ({
          'data-tense': tense === 'preterite' ? 'preterite' : 'present',
        }),
      },
      groupId: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.groupId,
        parseHTML: (element) => element.getAttribute('data-group-id') ?? '',
        renderHTML: ({ groupId }) => ({ 'data-group-id': groupId || '' }),
      },
      groupIndex: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.groupIndex,
        parseHTML: (element) => Number(element.getAttribute('data-group-index')) || 0,
        renderHTML: ({ groupIndex }) => ({
          'data-group-index': String(groupIndex || 0),
        }),
      },
      groupSize: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.groupSize,
        parseHTML: (element) => Math.max(
          1,
          Number(element.getAttribute('data-group-size')) || 1,
        ),
        renderHTML: ({ groupSize }) => ({
          'data-group-size': String(groupSize || 1),
        }),
      },
      leftVerb: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.leftVerb,
        parseHTML: (element) => element.getAttribute('data-left-verb') ?? 'sein',
        renderHTML: ({ leftVerb }) => ({ 'data-left-verb': leftVerb }),
      },
      leftForms: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.leftForms,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-left-forms'),
          DEFAULT_GERMAN_VERB_TABLE_ATTRS.leftForms,
        ),
        renderHTML: ({ leftForms }) => ({
          'data-left-forms': encodeURIComponent(JSON.stringify(leftForms)),
        }),
      },
      leftAuxiliary: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.leftAuxiliary,
        parseHTML: (element) => element.getAttribute('data-left-auxiliary') ?? 'sein',
        renderHTML: ({ leftAuxiliary }) => ({ 'data-left-auxiliary': leftAuxiliary }),
      },
      leftParticiple: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.leftParticiple,
        parseHTML: (element) => element.getAttribute('data-left-participle') ?? 'gewesen',
        renderHTML: ({ leftParticiple }) => ({ 'data-left-participle': leftParticiple }),
      },
      comparisonAuxiliary: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.comparisonAuxiliary,
        parseHTML: (element) => (
          element.getAttribute('data-comparison-auxiliary') === 'sein'
            ? 'sein'
            : 'haben'
        ),
        renderHTML: ({ comparisonAuxiliary }) => ({
          'data-comparison-auxiliary': comparisonAuxiliary,
        }),
      },
      separablePrefix: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.separablePrefix,
        parseHTML: (element) => (
          element.getAttribute('data-separable-prefix') ?? ''
        ),
        renderHTML: ({ separablePrefix }) => ({
          'data-separable-prefix': separablePrefix,
        }),
      },
      rightVerb: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.rightVerb,
        parseHTML: (element) => element.getAttribute('data-right-verb') ?? 'haben',
        renderHTML: ({ rightVerb }) => ({ 'data-right-verb': rightVerb }),
      },
      forms: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.forms,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-forms'),
          DEFAULT_GERMAN_VERB_TABLE_ATTRS.forms,
        ),
        renderHTML: ({ forms }) => ({
          'data-forms': encodeURIComponent(JSON.stringify(forms)),
        }),
      },
      rightAuxiliary: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.rightAuxiliary,
        parseHTML: (element) => element.getAttribute('data-right-auxiliary') ?? 'haben',
        renderHTML: ({ rightAuxiliary }) => ({ 'data-right-auxiliary': rightAuxiliary }),
      },
      rightParticiple: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.rightParticiple,
        parseHTML: (element) => element.getAttribute('data-right-participle') ?? 'gehabt',
        renderHTML: ({ rightParticiple }) => ({ 'data-right-participle': rightParticiple }),
      },
      multipleVerbCount: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.multipleVerbCount,
        parseHTML: (element) => (
          element.getAttribute('data-multiple-verb-count') === '4' ? 4 : 5
        ),
        renderHTML: ({ multipleVerbCount }) => ({
          'data-multiple-verb-count': multipleVerbCount,
        }),
      },
      multipleBadgeStyle: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.multipleBadgeStyle,
        parseHTML: (element) => (
          element.getAttribute('data-multiple-badge-style') === 'dark'
            ? 'dark'
            : 'light'
        ),
        renderHTML: ({ multipleBadgeStyle }) => ({
          'data-multiple-badge-style': multipleBadgeStyle,
        }),
      },
      multipleVerbs: {
        default: DEFAULT_GERMAN_VERB_TABLE_ATTRS.multipleVerbs,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-multiple-verbs'),
          DEFAULT_GERMAN_VERB_TABLE_ATTRS.multipleVerbs,
        ),
        renderHTML: ({ multipleVerbs }) => ({
          'data-multiple-verbs': encodeURIComponent(
            JSON.stringify(multipleVerbs),
          ),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="german-verb-table"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'german-verb-table',
    })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(GermanVerbTableNodeView);
  },
  addCommands() {
    return {
      insertGermanVerbTable: (attrs = {}) => ({ commands }) => (
        commands.insertContent({
          type: this.name,
          attrs: { ...DEFAULT_GERMAN_VERB_TABLE_ATTRS, ...attrs },
        })
      ),
    };
  },
});
