"use client";

import type { ReactNode, Ref } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { cx } from '@/utils/cx';

const DEFAULT_INSTRUCTION_TRANSLATIONS: Record<
  string,
  { formal: string; informal: string }
> = {
  'Add your instruction.': {
    formal: 'Fügen Sie Ihre Anweisung hinzu.',
    informal: 'Füge deine Anweisung hinzu.',
  },
  'Choose the correct answer.': {
    formal: 'Wählen Sie die richtige Antwort.',
    informal: 'Wähle die richtige Antwort.',
  },
  'Choose the correct answer for each row.':
    {
      formal: 'Wählen Sie für jede Zeile die richtige Antwort.',
      informal: 'Wähle für jede Zeile die richtige Antwort.',
    },
  'Choose the correct option.': {
    formal: 'Wählen Sie die richtige Option.',
    informal: 'Wähle die richtige Option.',
  },
  'Choose the correctly written words.': {
    formal: 'Wählen Sie die richtig geschriebenen Wörter.',
    informal: 'Wähle die richtig geschriebenen Wörter.',
  },
  'Complete the Frayer model for the concept.': {
    formal: 'Vervollständigen Sie das Frayer-Modell zum Begriff.',
    informal: 'Vervollständige das Frayer-Modell zum Begriff.',
  },
  'Complete the crossword using the clues.': {
    formal: 'Vervollständigen Sie das Kreuzworträtsel mithilfe der Hinweise.',
    informal: 'Vervollständige das Kreuzworträtsel mithilfe der Hinweise.',
  },
  'Complete the dialogue.': {
    formal: 'Vervollständigen Sie den Dialog.',
    informal: 'Vervollständige den Dialog.',
  },
  'Complete the table.': {
    formal: 'Vervollständigen Sie die Tabelle.',
    informal: 'Vervollständige die Tabelle.',
  },
  'Find and correct the errors in the text.': {
    formal: 'Finden und korrigieren Sie die Fehler im Text.',
    informal: 'Finde und korrigiere die Fehler im Text.',
  },
  'Fill in the blanks with the correct words.':
    {
      formal: 'Füllen Sie die Lücken mit den richtigen Wörtern.',
      informal: 'Fülle die Lücken mit den richtigen Wörtern.',
    },
  'Find the words in the grid.': {
    formal: 'Finden Sie die Wörter im Buchstabengitter.',
    informal: 'Finde die Wörter im Buchstabengitter.',
  },
  'Mark each statement as true or false.':
    {
      formal: 'Markieren Sie jede Aussage als richtig oder falsch.',
      informal: 'Markiere jede Aussage als richtig oder falsch.',
    },
  'Match the items on the left with the items on the right.':
    {
      formal: 'Verbinden Sie die Elemente links mit den passenden Elementen rechts.',
      informal: 'Verbinde die Elemente links mit den passenden Elementen rechts.',
    },
  'Number the items in the correct order.':
    {
      formal: 'Nummerieren Sie die Elemente in der richtigen Reihenfolge.',
      informal: 'Nummeriere die Elemente in der richtigen Reihenfolge.',
    },
  'Read the sentences and complete the forms.':
    {
      formal: 'Lesen Sie die Sätze und vervollständigen Sie die Formulare.',
      informal: 'Lies die Sätze und vervollständige die Formulare.',
    },
  'Review the following glossary terms.':
    {
      formal: 'Lesen Sie die folgenden Glossarbegriffe.',
      informal: 'Lies die folgenden Glossarbegriffe.',
    },
  'Rewrite the sentences correctly.': {
    formal: 'Schreiben Sie die Sätze richtig um.',
    informal: 'Schreibe die Sätze richtig um.',
  },
  'Sort the items into the correct categories.':
    {
      formal: 'Ordnen Sie die Elemente den richtigen Kategorien zu.',
      informal: 'Ordne die Elemente den richtigen Kategorien zu.',
    },
  'Use the number code to find the words.': {
    formal: 'Entschlüsseln Sie die Wörter mithilfe des Zahlencodes.',
    informal: 'Entschlüssle die Wörter mithilfe des Zahlencodes.',
  },
};

export function CustomBlockRoot({
  selected,
  className,
  rootRef,
  children,
}: {
  selected: boolean;
  className?: string;
  rootRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <NodeViewWrapper
      ref={rootRef}
      className={cx(
        'custom-block',
        selected && 'custom-block--selected',
        className,
      )}
      data-drag-handle
    >
      {children}
    </NodeViewWrapper>
  );
}

export function BlockInstruction({
  children,
}: {
  children: ReactNode;
}) {
  const englishInstruction = typeof children === 'string'
    ? children.trim()
    : '';
  const germanInstruction = DEFAULT_INSTRUCTION_TRANSLATIONS[englishInstruction];

  return (
    <header className="custom-block__instruction">
      <span aria-hidden="true" className="custom-block__badge" />
      <strong className="custom-block__instruction-text">
        {germanInstruction ? (
          <>
            <span className="custom-block__instruction-language custom-block__instruction-language--en">
              {children}
            </span>
            <span className="custom-block__instruction-language custom-block__instruction-language--de">
              {germanInstruction.informal}
            </span>
            <span className="custom-block__instruction-language custom-block__instruction-language--de-formal">
              {germanInstruction.formal}
            </span>
          </>
        ) : children}
      </strong>
    </header>
  );
}

export function BlockQuestion({
  children,
}: {
  children?: ReactNode;
}) {
  const hasContent = typeof children === 'string'
    ? children.trim().length > 0
    : children !== null && children !== undefined && children !== false;

  if (!hasContent) return null;

  return (
    <p className="custom-block__question">
      {children}
    </p>
  );
}

export function BlockRows({
  children,
  columns = 1,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div className="custom-block__rows" data-columns={columns}>
      {children}
    </div>
  );
}

export function BlockRow({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <div className="custom-block__row">
      <span className="custom-block__row-index">
        {String(index + 1).padStart(2, '0')}
      </span>
      {children}
    </div>
  );
}

export function BlockChoiceIndicator({
  checked,
  example = false,
  solutionKey,
}: {
  checked: boolean;
  example?: boolean;
  solutionKey?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'custom-block__choice-indicator',
        checked && 'custom-block__choice-indicator--checked',
      )}
      data-rough-solution-x={solutionKey ? true : undefined}
      data-solution-kind={example ? 'example' : 'solution'}
      data-solution-key={solutionKey}
    >
      {checked ? '✓' : ''}
    </span>
  );
}

export function BlockRowLabel({ children }: { children: ReactNode }) {
  return <span className="custom-block__row-label">{children}</span>;
}
