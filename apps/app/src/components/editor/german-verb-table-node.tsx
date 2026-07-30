"use client";

import type { ReactNode } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import {
  buildGermanVerbReferenceForms,
  differingActualCharacters,
  firstPersonAuxiliary,
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

export type GermanVerbTableStyle = 'extended' | 'compact';

export type GermanVerbTableAttrs = {
  tableStyle: GermanVerbTableStyle;
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
};

export const DEFAULT_GERMAN_VERB_TABLE_ATTRS: GermanVerbTableAttrs = {
  tableStyle: 'extended',
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
  const { characters, differs } = differingActualCharacters(actual, reference);
  const runs: Array<{ different: boolean; text: string }> = [];
  characters.forEach((character, index) => {
    const previous = runs.at(-1);
    if (previous?.different === differs[index]) {
      previous.text += character;
    } else {
      runs.push({ different: differs[index], text: character });
    }
  });

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
  const splitPrefix = (value: string) => {
    const trimmed = value.trimEnd();
    const hasPrefix = trimmed
      .toLocaleLowerCase('de-DE')
      .endsWith(normalizedPrefix.toLocaleLowerCase('de-DE'));
    return {
      base: hasPrefix
        ? trimmed.slice(0, -normalizedPrefix.length).trimEnd()
        : value,
      hasPrefix,
    };
  };
  const actualParts = splitPrefix(actual);
  const referenceParts = splitPrefix(reference);

  return (
    <span className="german-verb-table-node__separable-value">
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

function GermanVerbTableNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as GermanVerbTableAttrs;
  const tableStyle = attrs.tableStyle === 'compact' ? 'compact' : 'extended';
  const extended = tableStyle === 'extended';
  const leftForms = {
    ...DEFAULT_GERMAN_VERB_TABLE_ATTRS.leftForms,
    ...attrs.leftForms,
  };
  const separablePrefix = attrs.separablePrefix?.trim() ?? '';
  const referenceForms = buildGermanVerbReferenceForms(
    attrs.leftVerb,
    separablePrefix,
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

  return (
    <CustomBlockRoot selected={selected} className="german-verb-table-node">
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
              PRÄSENS
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
                  Präsens
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
            <div
              className="german-verb-table-node__row german-verb-table-node__preterite"
              role="row"
            >
              <VerbCell
                className="german-verb-table-node__cell--meta-label"
                header
              >
                Präteritum
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
              <VerbCell className="german-verb-table-node__form">
                <SeparableVerbForm
                  actual={leftForms.preteriteIch}
                  reference={referenceForms.preteriteIch}
                  separablePrefix={separablePrefix}
                />
              </VerbCell>
            </div>
          </>
        )}
      </div>
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
        parseHTML: (element) => (
          element.getAttribute('data-table-style') === 'compact'
            ? 'compact'
            : 'extended'
        ),
        renderHTML: ({ tableStyle }) => ({
          'data-table-style': tableStyle,
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
