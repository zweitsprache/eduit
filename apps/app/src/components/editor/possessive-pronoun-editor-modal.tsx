"use client";

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { createPortal } from 'react-dom';
import { XClose } from '@untitledui/icons';
import {
  DEFAULT_POSSESSIVE_PRONOUN_ATTRS,
  POSSESSIVE_PRONOUN_CASES,
  POSSESSIVE_PRONOUN_GENDERS,
  POSSESSIVE_PRONOUN_PERSONS,
  type PossessivePronounAttrs,
  type PossessivePronounCaseKey,
  type PossessivePronounGenderKey,
  type PossessivePronounPersonKey,
} from '@/components/editor/possessive-pronoun-node';

type PossessivePronounBlock = { pos: number; type: 'possessivePronoun' };

const inputClass = 'h-9 min-w-20 w-full rounded-md border border-primary bg-primary px-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

export function PossessivePronounEditorModal({
  block,
  editor,
  onClose,
}: {
  block: PossessivePronounBlock | null;
  editor: Editor;
  onClose: () => void;
}) {
  const attrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!block) return null;
      const node = currentEditor.state.doc.nodeAt(block.pos);
      return node?.type.name === 'possessivePronoun'
        ? node.attrs as PossessivePronounAttrs
        : null;
    },
  });
  const [draft, setDraft] = useState<PossessivePronounAttrs | null>(null);

  useEffect(() => {
    if (!attrs) return;
    setDraft({
      ...DEFAULT_POSSESSIVE_PRONOUN_ATTRS,
      ...attrs,
      rows: attrs.rows?.length
        ? attrs.rows
        : DEFAULT_POSSESSIVE_PRONOUN_ATTRS.rows,
    });
  }, [attrs]);

  if (!block || !draft || typeof document === 'undefined') return null;

  const setValue = (
    caseKey: PossessivePronounCaseKey,
    genderKey: PossessivePronounGenderKey,
    personKey: PossessivePronounPersonKey,
    value: string,
  ) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        rows: current.rows.map((caseRow) => (
          caseRow.key !== caseKey
            ? caseRow
            : {
              ...caseRow,
              genders: caseRow.genders.map((genderRow) => (
                genderRow.gender !== genderKey
                  ? genderRow
                  : {
                    ...genderRow,
                    values: { ...genderRow.values, [personKey]: value },
                  }
              )),
            }
        )),
      };
    });
  };

  const toggleCase = (caseKey: PossessivePronounCaseKey) => {
    setDraft((current) => {
      if (!current) return current;
      const displayedCases = current.displayedCases
        ?? DEFAULT_POSSESSIVE_PRONOUN_ATTRS.displayedCases;
      const isDisplayed = displayedCases.includes(caseKey);
      if (isDisplayed && displayedCases.length === 1) return current;
      return {
        ...current,
        displayedCases: POSSESSIVE_PRONOUN_CASES
          .map(({ key }) => key)
          .filter((key) => (
            key === caseKey ? !isDisplayed : displayedCases.includes(key)
          )),
      };
    });
  };

  const setAdditional = (
    caseKey: PossessivePronounCaseKey,
    genderKey: PossessivePronounGenderKey,
    value: string,
  ) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        rows: current.rows.map((caseRow) => (
          caseRow.key !== caseKey
            ? caseRow
            : {
              ...caseRow,
              genders: caseRow.genders.map((genderRow) => (
                genderRow.gender === genderKey
                  ? { ...genderRow, additional: value }
                  : genderRow
              )),
            }
        )),
      };
    });
  };

  const save = () => {
    editor.chain().command(({ tr }) => {
      if (tr.doc.nodeAt(block.pos)?.type.name !== 'possessivePronoun') return false;
      tr.setNodeAttribute(block.pos, 'rows', draft.rows);
      tr.setNodeAttribute(block.pos, 'displayedCases', draft.displayedCases);
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
        aria-label="Possessivpronomen bearbeiten"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl"
        role="dialog"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary px-6">
          <h2 className="text-base font-semibold text-primary">Possessivpronomen</h2>
          <button
            aria-label="Schliessen"
            className="rounded-md p-2 text-tertiary transition hover:bg-primary_hover hover:text-primary"
            onClick={onClose}
            type="button"
          >
            <XClose className="size-5" />
          </button>
        </header>

        <div className="overflow-auto p-6">
          <fieldset className="mb-6">
            <legend className="mb-2 text-sm font-semibold text-primary">Kasus anzeigen</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {POSSESSIVE_PRONOUN_CASES.map(({ key, label }) => {
                const checked = draft.displayedCases.includes(key);
                return (
                  <label className="inline-flex items-center gap-2 text-sm text-secondary" key={key}>
                    <input
                      checked={checked}
                      className="size-4 rounded border-primary text-brand-secondary focus:ring-brand"
                      disabled={checked && draft.displayedCases.length === 1}
                      onChange={() => toggleCase(key)}
                      type="checkbox"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="space-y-6">
            {POSSESSIVE_PRONOUN_CASES
              .filter(({ key }) => draft.displayedCases.includes(key))
              .map((currentCase) => {
              const caseRow = draft.rows.find((row) => row.key === currentCase.key);
              return (
                <section className="overflow-hidden rounded-xl border border-secondary" key={currentCase.key}>
                  <h3 className="border-b border-secondary bg-secondary px-4 py-3 text-sm font-semibold text-primary">
                    {currentCase.label}
                  </h3>
                  <div className="overflow-x-auto p-4">
                    <div className="grid min-w-[960px] grid-cols-[7rem_repeat(9,minmax(5rem,1fr))] gap-2">
                      <div />
                      {POSSESSIVE_PRONOUN_PERSONS.map(({ key, label }) => (
                        <div className="text-center text-xs font-semibold text-tertiary" key={key}>
                          {label}
                        </div>
                      ))}
                      <div aria-hidden="true" />
                      {POSSESSIVE_PRONOUN_GENDERS.flatMap(({ key: gender, label }) => {
                        const genderRow = caseRow?.genders.find((row) => row.gender === gender);
                        return [
                          <div className="flex items-center text-sm font-semibold text-primary" key={`${gender}-label`}>
                            {label}
                          </div>,
                          ...POSSESSIVE_PRONOUN_PERSONS.map(({ key: person }) => (
                            <input
                              aria-label={`${currentCase.label} ${label} ${person}`}
                              className={inputClass}
                              key={`${gender}-${person}`}
                              onChange={(event) => setValue(
                                currentCase.key,
                                gender,
                                person,
                                event.target.value,
                              )}
                              value={genderRow?.values[person] ?? ''}
                            />
                          )),
                          <input
                            aria-label={`${currentCase.label} ${label} Zusatzspalte`}
                            className={inputClass}
                            key={`${gender}-additional`}
                            onChange={(event) => setAdditional(
                              currentCase.key,
                              gender,
                              event.target.value,
                            )}
                            value={genderRow?.additional ?? ''}
                          />,
                        ];
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
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