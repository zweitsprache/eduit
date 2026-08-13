"use client";

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { createPortal } from 'react-dom';
import { XClose } from '@untitledui/icons';
import { WandSparkles } from 'lucide-react';
import {
  DEFAULT_DECLINATION_TABLE_ATTRS,
  type DeclinationCaseKey,
  type DeclinationFormIndex,
  type DeclinationGenderKey,
  type DeclinationTableAttrs,
} from '@/components/editor/declination-table-node';

type DeclinationTableBlock = { pos: number; type: 'declinationTable' };

const CASES: Array<{ key: DeclinationCaseKey; label: string }> = [
  { key: 'nom', label: 'NOM' },
  { key: 'akk', label: 'AKK' },
  { key: 'dat', label: 'DAT' },
  { key: 'gen', label: 'GEN' },
];

const GENDERS: Array<{ key: DeclinationGenderKey; label: string }> = [
  { key: 'masculine', label: 'maskulin' },
  { key: 'neuter', label: 'neutral' },
  { key: 'feminine', label: 'feminin' },
  { key: 'plural', label: 'plural' },
];

const FORMS: DeclinationFormIndex[] = [0, 1, 2];

const inputClass = 'h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

export function DeclinationTableEditorModal({
  block,
  editor,
  onOpenAI,
  onClose,
}: {
  block: DeclinationTableBlock | null;
  editor: Editor;
  onOpenAI: () => void;
  onClose: () => void;
}) {
  const attrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!block) return null;
      const node = currentEditor.state.doc.nodeAt(block.pos);
      return node?.type.name === 'declinationTable'
        ? node.attrs as DeclinationTableAttrs
        : null;
    },
  });
  const [draft, setDraft] = useState<DeclinationTableAttrs | null>(null);

  useEffect(() => {
    if (!attrs) return;
    setDraft({
      ...DEFAULT_DECLINATION_TABLE_ATTRS,
      ...attrs,
      rows: attrs.rows?.length
        ? attrs.rows
        : DEFAULT_DECLINATION_TABLE_ATTRS.rows,
    });
  }, [attrs]);

  if (!block || !draft || typeof document === 'undefined') return null;

  const setField = (
    caseKey: DeclinationCaseKey,
    genderKey: DeclinationGenderKey,
    field: 'article' | 'adjective' | 'noun',
    formIndex: DeclinationFormIndex,
    value: string,
  ) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        rows: current.rows.map((row) => {
          if (row.key !== caseKey) return row;
          const nextTriplet = {
            ...row.values[genderKey],
            [field]: [...row.values[genderKey][field]] as [string, string, string],
          };
          nextTriplet[field][formIndex] = value;
          return {
            ...row,
            values: {
              ...row.values,
              [genderKey]: nextTriplet,
            },
          };
        }),
      };
    });
  };

  const save = () => {
    editor.chain().command(({ tr }) => {
      if (tr.doc.nodeAt(block.pos)?.type.name !== 'declinationTable') return false;
      tr.setNodeAttribute(block.pos, 'rows', draft.rows);
      tr.setNodeAttribute(block.pos, 'baseAdjectives', draft.baseAdjectives);
      tr.setNodeAttribute(block.pos, 'baseNouns', draft.baseNouns);
      return true;
    }).run();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-label="Deklinationstabelle bearbeiten"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl"
        role="dialog"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary px-6">
          <h2 className="text-base font-semibold text-primary">Deklinationstabelle</h2>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-brand-secondary bg-primary px-3 py-1.5 text-xs font-semibold text-brand-secondary transition hover:bg-brand-primary"
              onClick={onOpenAI}
              type="button"
            >
              <WandSparkles className="size-3.5" />
              Eduit AI
            </button>
            <button
              aria-label="Schliessen"
              className="rounded-md p-2 text-tertiary transition hover:bg-primary_hover hover:text-primary"
              onClick={onClose}
              type="button"
            >
              <XClose className="size-5" />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto p-6">
          <div className="space-y-6">
            {CASES.map((currentCase) => (
              <section className="rounded-xl border border-secondary" key={currentCase.key}>
                <div className="border-b border-secondary bg-secondary px-4 py-3 text-sm font-semibold text-primary">
                  {currentCase.label}
                </div>
                <div className="space-y-4 p-4">
                  {GENDERS.map((gender) => {
                    const row = draft.rows.find((item) => item.key === currentCase.key);
                    const value = row?.values[gender.key];
                    if (!value) return null;
                    return (
                      <section key={`${currentCase.key}-${gender.key}`}>
                        <h3 className="text-sm font-semibold text-primary">{gender.label}</h3>
                        <div className="mt-2 grid gap-2 md:grid-cols-3">
                          {([
                            ['article', 'Artikel'],
                            ['adjective', 'Adjektiv'],
                            ['noun', 'Nomen'],
                          ] as const).map(([field, label]) => (
                            <div className="rounded-lg border border-secondary p-3" key={`${gender.key}-${field}`}>
                              <p className="text-xs font-semibold uppercase tracking-wide text-tertiary">{label}</p>
                              <div className="mt-2 space-y-2">
                                {FORMS.map((index) => (
                                  <input
                                    className={inputClass}
                                    key={`${currentCase.key}-${gender.key}-${field}-${index}`}
                                    onChange={(event) => setField(
                                      currentCase.key,
                                      gender.key,
                                      field,
                                      index,
                                      event.target.value,
                                    )}
                                    placeholder={`Form ${index + 1}`}
                                    value={value[field][index]}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <footer className="flex shrink-0 justify-end gap-3 border-t border-secondary px-6 py-4">
          <button
            className="h-10 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-secondary transition hover:bg-primary_hover"
            onClick={onClose}
            type="button"
          >
            Abbrechen
          </button>
          <button
            className="h-10 rounded-md bg-brand-solid px-4 text-sm font-semibold text-white transition hover:bg-brand-solid_hover"
            onClick={save}
            type="button"
          >
            Speichern
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
