"use client";

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { createPortal } from 'react-dom';
import { XClose } from '@untitledui/icons';
import {
  DEFAULT_GERMAN_VERB_TABLE_ATTRS,
  type GermanVerbTableAttrs,
  type GermanVerbTableForms,
} from '@/components/editor/german-verb-table-node';

type GermanVerbTableBlock = { pos: number; type: 'germanVerbTable' };

const fields: Array<{
  key: keyof GermanVerbTableForms;
  label: string;
  pronoun: string;
}> = [
  { key: 'ich', label: 'Präsens', pronoun: 'ich' },
  { key: 'du', label: 'Präsens informell', pronoun: 'du' },
  { key: 'formalSingular', label: 'Präsens formell', pronoun: 'Sie' },
  { key: 'thirdSingular', label: 'Präsens', pronoun: 'er / sie / es' },
  { key: 'wir', label: 'Präsens', pronoun: 'wir' },
  { key: 'ihr', label: 'Präsens informell', pronoun: 'ihr' },
  { key: 'formalPlural', label: 'Präsens formell', pronoun: 'Sie' },
  { key: 'thirdPlural', label: 'Präsens', pronoun: 'sie' },
  { key: 'preteriteIch', label: 'Präteritum', pronoun: 'ich' },
];

const inputClass = 'h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

export function GermanVerbTableEditorModal({
  block,
  editor,
  onClose,
}: {
  block: GermanVerbTableBlock | null;
  editor: Editor;
  onClose: () => void;
}) {
  const attrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!block) return null;
      const node = currentEditor.state.doc.nodeAt(block.pos);
      return node?.type.name === 'germanVerbTable'
        ? node.attrs as GermanVerbTableAttrs
        : null;
    },
  });
  const [draft, setDraft] = useState<GermanVerbTableAttrs | null>(null);

  useEffect(() => {
    if (!attrs) return;
    setDraft({
      ...DEFAULT_GERMAN_VERB_TABLE_ATTRS,
      ...attrs,
      leftForms: {
        ...DEFAULT_GERMAN_VERB_TABLE_ATTRS.leftForms,
        ...attrs.leftForms,
      },
      forms: {
        ...DEFAULT_GERMAN_VERB_TABLE_ATTRS.forms,
        ...attrs.forms,
      },
    });
  }, [attrs]);

  if (!block || !draft || typeof document === 'undefined') return null;

  const save = () => {
    editor.chain().command(({ tr }) => {
      if (tr.doc.nodeAt(block.pos)?.type.name !== 'germanVerbTable') return false;
      Object.entries(draft).forEach(([key, value]) => {
        tr.setNodeAttribute(block.pos, key, value);
      });
      return true;
    }).run();
    onClose();
  };

  const setForm = (
    side: 'leftForms' | 'forms',
    key: keyof GermanVerbTableForms,
    value: string,
  ) => setDraft((current) => current ? {
    ...current,
    [side]: { ...current[side], [key]: value },
  } : current);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-label="Deutsche Verbtabelle bearbeiten"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl"
        role="dialog"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary px-6">
          <h2 className="text-base font-semibold text-primary">Verbtabelle Deutsch</h2>
          <button
            aria-label="Schliessen"
            className="rounded-md p-2 text-tertiary transition hover:bg-primary_hover hover:text-primary"
            onClick={onClose}
            type="button"
          >
            <XClose className="size-5" />
          </button>
        </header>
        <div className="overflow-y-auto p-6">
          <fieldset>
            <legend className="text-sm font-semibold text-primary">Stil</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {([
                ['extended', 'Extended', 'Mit Zeitform und Numerus'],
                [
                  'compact',
                  'Compact',
                  'Singular und Plural nebeneinander',
                ],
              ] as const).map(([value, label, description]) => (
                <button
                  aria-pressed={draft.tableStyle === value}
                  className={`rounded-lg border p-3 text-left transition ${
                    draft.tableStyle === value
                      ? 'border-brand bg-brand-primary'
                      : 'border-primary bg-primary hover:bg-primary_hover'
                  }`}
                  key={value}
                  onClick={() => setDraft((current) => current
                    ? { ...current, tableStyle: value }
                    : current)}
                  type="button"
                >
                  <span className="block text-sm font-semibold text-primary">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-tertiary">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mt-5 block text-sm font-semibold text-primary">
            Verb
            <input
              className={`mt-1.5 ${inputClass}`}
              onChange={(event) => setDraft((current) => current
                ? { ...current, leftVerb: event.target.value }
                : current)}
              value={draft.leftVerb}
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-primary">
            Trennbares Präfix
            <input
              className={`mt-1.5 ${inputClass}`}
              onChange={(event) => setDraft((current) => current
                ? { ...current, separablePrefix: event.target.value }
                : current)}
              placeholder="z. B. ab"
              value={draft.separablePrefix}
            />
            <span className="mt-1 block text-xs font-normal text-tertiary">
              Leer lassen, wenn das Verb nicht trennbar ist.
            </span>
          </label>

          <div className="mt-5 overflow-hidden rounded-xl border border-secondary">
            <div className="grid grid-cols-[10rem_minmax(0,1fr)] gap-3 border-b border-secondary bg-secondary px-4 py-3 text-sm font-semibold text-primary">
              <span>Form</span>
              <span>{draft.leftVerb || 'Verb'}</span>
            </div>
            {fields.map((field) => (
              <div
                className="grid grid-cols-[10rem_minmax(0,1fr)] items-center gap-3 border-b border-secondary px-4 py-3 last:border-b-0"
                key={field.key}
              >
                <span className="text-sm font-semibold text-primary">
                  {field.pronoun}
                  <span className="block text-xs font-normal text-tertiary">
                    {field.label}
                  </span>
                </span>
                <input
                  aria-label={`${draft.leftVerb} ${field.pronoun}`}
                  className={inputClass}
                  onChange={(event) => setForm('leftForms', field.key, event.target.value)}
                  value={draft.leftForms[field.key]}
                />
              </div>
            ))}
          </div>

          {([
            ['Hilfsverb', 'leftAuxiliary'],
            ['Partizip II', 'leftParticiple'],
          ] as const).map(([label, leftKey]) => (
            <div
              className="mt-4 grid grid-cols-[10rem_minmax(0,1fr)] items-center gap-3"
              key={label}
            >
              <span className="text-sm font-semibold text-primary">{label}</span>
              <input
                aria-label={`${label} ${draft.leftVerb}`}
                className={inputClass}
                onChange={(event) => setDraft((current) => current
                  ? { ...current, [leftKey]: event.target.value }
                  : current)}
                value={draft[leftKey]}
              />
            </div>
          ))}
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
