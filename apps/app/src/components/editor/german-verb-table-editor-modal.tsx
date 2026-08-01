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
  type GermanVerbTableMultipleBadgeStyle,
  type GermanVerbTableMultipleCount,
  type GermanVerbTableMultipleVerb,
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
];

const inputClass = 'h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

export function GermanVerbTableEditorModal({
  block,
  documentSize,
  editor,
  onClose,
}: {
  block: GermanVerbTableBlock | null;
  documentSize: string;
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
  const landscape = documentSize.endsWith('-landscape');

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
      multipleVerbs: DEFAULT_GERMAN_VERB_TABLE_ATTRS.multipleVerbs.map(
        (fallback, index) => {
          const value = attrs.multipleVerbs?.[index];
          return {
            ...fallback,
            ...value,
            forms: { ...fallback.forms, ...value?.forms },
          };
        },
      ),
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

  const setMultipleVerb = (
    index: number,
    patch: Partial<GermanVerbTableMultipleVerb>,
  ) => setDraft((current) => current ? {
    ...current,
    multipleVerbs: current.multipleVerbs.map((verb, verbIndex) => (
      verbIndex === index ? { ...verb, ...patch } : verb
    )),
  } : current);

  const setMultipleForm = (
    index: number,
    key: keyof GermanVerbTableForms,
    value: string,
  ) => setDraft((current) => current ? {
    ...current,
    multipleVerbs: current.multipleVerbs.map((verb, verbIndex) => (
      verbIndex === index
        ? { ...verb, forms: { ...verb.forms, [key]: value } }
        : verb
    )),
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
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {([
                ['extended', 'Extended', 'Mit Zeitform und Numerus'],
                [
                  'compact',
                  'Compact',
                  'Singular und Plural nebeneinander',
                ],
                [
                  'multiple',
                  'Multiple',
                  'Fünf Verben, Singular und Plural untereinander',
                ],
              ] as const).map(([value, label, description]) => (
                <button
                  aria-pressed={draft.tableStyle === value}
                  disabled={value === 'multiple' && !landscape}
                  className={`rounded-lg border p-3 text-left transition ${
                    draft.tableStyle === value
                      ? 'border-brand bg-brand-primary'
                      : value === 'multiple' && !landscape
                        ? 'cursor-not-allowed border-primary bg-secondary opacity-50'
                        : 'border-primary bg-primary hover:bg-primary_hover'
                  }`}
                  key={value}
                  onClick={() => setDraft((current) => current
                    ? {
                      ...current,
                      tableStyle: value,
                      multipleVerbs: value === 'multiple'
                        && current.tableStyle !== 'multiple'
                        ? current.multipleVerbs.map((verb, index) => {
                          if (index === 0) {
                            return {
                              verb: current.leftVerb,
                              forms: current.leftForms,
                              separablePrefix: current.separablePrefix,
                            };
                          }
                          if (index === 1) {
                            return {
                              verb: current.rightVerb,
                              forms: current.forms,
                              separablePrefix: '',
                            };
                          }
                          return verb;
                        })
                        : current.multipleVerbs,
                    }
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
            {!landscape && (
              <p className="mt-2 text-xs text-tertiary">
                Multiple ist nur für Arbeitsblätter im Querformat verfügbar.
              </p>
            )}
          </fieldset>

          {draft.tableStyle === 'multiple' ? (
            <div className="mt-5 space-y-5">
              <fieldset>
                <legend className="text-sm font-semibold text-primary">
                  Anzahl Verben
                </legend>
                <div className="mt-1.5 flex gap-2">
                  {([4, 5] as const).map((count) => (
                    <button
                      aria-pressed={draft.multipleVerbCount === count}
                      className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                        draft.multipleVerbCount === count
                          ? 'border-brand bg-brand-primary text-brand-secondary'
                          : 'border-primary bg-primary text-secondary hover:bg-primary_hover'
                      }`}
                      key={count}
                      onClick={() => setDraft((current) => current ? {
                        ...current,
                        multipleVerbCount:
                          count as GermanVerbTableMultipleCount,
                      } : current)}
                      type="button"
                    >
                      {count} Verben
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-semibold text-primary">
                  Infinitiv-Badges
                </legend>
                <div className="mt-1.5 flex gap-2">
                  {([
                    ['light', 'Light'],
                    ['dark', 'Dark'],
                  ] as const).map(([style, label]) => (
                    <button
                      aria-pressed={draft.multipleBadgeStyle === style}
                      className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                        draft.multipleBadgeStyle === style
                          ? 'border-brand bg-brand-primary text-brand-secondary'
                          : 'border-primary bg-primary text-secondary hover:bg-primary_hover'
                      }`}
                      key={style}
                      onClick={() => setDraft((current) => current ? {
                        ...current,
                        multipleBadgeStyle:
                          style as GermanVerbTableMultipleBadgeStyle,
                      } : current)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              {draft.multipleVerbs
                .slice(0, draft.multipleVerbCount)
                .map((verb, index) => (
                <section
                  className="overflow-hidden rounded-xl border border-secondary"
                  key={index}
                >
                  <div className="grid grid-cols-2 gap-3 border-b border-secondary bg-secondary p-4">
                    <label className="text-sm font-semibold text-primary">
                      Verb {index + 1}
                      <input
                        className={`mt-1.5 ${inputClass}`}
                        onChange={(event) => setMultipleVerb(index, {
                          verb: event.target.value,
                        })}
                        value={verb.verb}
                      />
                    </label>
                    <label className="text-sm font-semibold text-primary">
                      Trennbares Präfix
                      <input
                        className={`mt-1.5 ${inputClass}`}
                        onChange={(event) => setMultipleVerb(index, {
                          separablePrefix: event.target.value,
                        })}
                        placeholder="z. B. ab oder ein"
                        value={verb.separablePrefix}
                      />
                    </label>
                  </div>
                  {fields.slice(0, 8).map((field) => (
                    <div
                      className="grid grid-cols-[10rem_minmax(0,1fr)] items-center gap-3 border-b border-secondary px-4 py-3 last:border-b-0"
                      key={field.key}
                    >
                      <span className="text-sm font-semibold text-primary">
                        {field.pronoun}
                      </span>
                      <input
                        aria-label={`${verb.verb} ${field.pronoun}`}
                        className={inputClass}
                        onChange={(event) => setMultipleForm(
                          index,
                          field.key,
                          event.target.value,
                        )}
                        placeholder={verb.separablePrefix
                          ? `z. B. Wortstamm ${verb.separablePrefix}`
                          : undefined}
                        value={verb.forms[field.key]}
                      />
                    </div>
                  ))}
                </section>
                ))}
            </div>
          ) : (
            <>
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
                    {field.label.replace(
                      'Präsens',
                      draft.tense === 'preterite' ? 'Präteritum' : 'Präsens',
                    )}
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
            </>
          )}
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
