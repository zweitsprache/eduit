"use client";

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { createPortal } from 'react-dom';
import { XClose } from '@untitledui/icons';
import {
  DEFAULT_INDEFINITE_ARTICLE_ATTRS,
  INDEFINITE_ARTICLE_CASES,
  INDEFINITE_ARTICLE_GENDERS,
  type IndefiniteArticleAttrs,
  type IndefiniteArticleCaseKey,
  type IndefiniteArticleGenderKey,
} from '@/components/editor/indefinite-article-node';

type IndefiniteArticleBlock = { pos: number; type: 'indefiniteArticle' };

const inputClass = 'h-9 min-w-24 w-full rounded-md border border-primary bg-primary px-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

export function IndefiniteArticleEditorModal({
  block,
  editor,
  onClose,
}: {
  block: IndefiniteArticleBlock | null;
  editor: Editor;
  onClose: () => void;
}) {
  const attrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!block) return null;
      const node = currentEditor.state.doc.nodeAt(block.pos);
      return node?.type.name === 'indefiniteArticle'
        ? node.attrs as IndefiniteArticleAttrs
        : null;
    },
  });
  const [draft, setDraft] = useState<IndefiniteArticleAttrs | null>(null);

  useEffect(() => {
    if (!attrs) return;
    setDraft({
      ...DEFAULT_INDEFINITE_ARTICLE_ATTRS,
      ...attrs,
      rows: attrs.rows?.length ? attrs.rows : DEFAULT_INDEFINITE_ARTICLE_ATTRS.rows,
    });
  }, [attrs]);

  if (!block || !draft || typeof document === 'undefined') return null;

  const setValue = (
    genderKey: IndefiniteArticleGenderKey,
    caseKey: IndefiniteArticleCaseKey,
    value: string,
  ) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        rows: current.rows.map((row) => (
          row.gender === genderKey
            ? { ...row, values: { ...row.values, [caseKey]: value } }
            : row
        )),
      };
    });
  };

  const toggleCase = (caseKey: IndefiniteArticleCaseKey) => {
    setDraft((current) => {
      if (!current) return current;
      const isDisplayed = current.displayedCases.includes(caseKey);
      if (isDisplayed && current.displayedCases.length === 1) return current;
      return {
        ...current,
        displayedCases: INDEFINITE_ARTICLE_CASES
          .map(({ key }) => key)
          .filter((key) => (
            key === caseKey ? !isDisplayed : current.displayedCases.includes(key)
          )),
      };
    });
  };

  const setAdditional = (
    genderKey: IndefiniteArticleGenderKey,
    value: string,
  ) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        rows: current.rows.map((row) => (
          row.gender === genderKey ? { ...row, additional: value } : row
        )),
      };
    });
  };

  const save = () => {
    editor.chain().command(({ tr }) => {
      if (tr.doc.nodeAt(block.pos)?.type.name !== 'indefiniteArticle') return false;
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
        aria-label="Unbestimmter Artikel bearbeiten"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl"
        role="dialog"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary px-6">
          <h2 className="text-base font-semibold text-primary">Unbestimmter Artikel</h2>
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
              {INDEFINITE_ARTICLE_CASES.map(({ key, label }) => {
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
          <div
            className="grid min-w-[680px] gap-2"
            style={{
              gridTemplateColumns: `7.5rem repeat(${draft.displayedCases.length + 1}, minmax(7rem, 1fr))`,
            }}
          >
            <div />
            {INDEFINITE_ARTICLE_CASES
              .filter(({ key }) => draft.displayedCases.includes(key))
              .map(({ key, label }) => (
              <div className="text-xs font-semibold text-tertiary" key={key}>{label}</div>
            ))}
            <div aria-hidden="true" />
            {INDEFINITE_ARTICLE_GENDERS.flatMap(({ key: gender, label }) => {
              const row = draft.rows.find((item) => item.gender === gender);
              return [
                <div className="flex items-center text-sm font-semibold text-primary" key={`${gender}-label`}>
                  {label}
                </div>,
                ...INDEFINITE_ARTICLE_CASES
                  .filter(({ key }) => draft.displayedCases.includes(key))
                  .map(({ key }) => (
                  <input
                    aria-label={`${label} ${key}`}
                    className={inputClass}
                    key={`${gender}-${key}`}
                    onChange={(event) => setValue(gender, key, event.target.value)}
                    value={row?.values[key] ?? ''}
                  />
                )),
                <input
                  aria-label={`${label} Zusatzspalte`}
                  className={inputClass}
                  key={`${gender}-additional`}
                  onChange={(event) => setAdditional(gender, event.target.value)}
                  value={row?.additional ?? ''}
                />,
              ];
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