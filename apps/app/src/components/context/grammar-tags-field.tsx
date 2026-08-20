"use client";

import { useMemo, useState } from 'react';
import {
  GRAMMAR_TAG_LABEL_BY_ID,
  GRAMMAR_TAG_OPTIONS,
} from '@/lib/grammar-tags';

const INPUT_CLASS =
  'mt-1.5 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

const MAX_MATCHES = 40;

function normalize(value: string) {
  return value
    .toLocaleLowerCase('de-CH')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function GrammarTagsField({
  value,
  onChange,
  className = '',
}: {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const selected = useMemo(() => new Set(value), [value]);
  const normalizedQuery = normalize(query.trim());

  const matches = useMemo(() => {
    if (!normalizedQuery) return [];
    return GRAMMAR_TAG_OPTIONS
      .filter((option) => !selected.has(option.id))
      .filter((option) => {
        const haystack = `${option.pathLabel} ${option.id}`;
        return normalize(haystack).includes(normalizedQuery);
      })
      .slice(0, MAX_MATCHES);
  }, [normalizedQuery, selected]);

  const addTag = (id: string) => {
    if (selected.has(id)) return;
    onChange([...value, id]);
    setQuery('');
  };

  const removeTag = (id: string) => {
    onChange(value.filter((item) => item !== id));
  };

  return (
    <fieldset className={className}>
      <legend className="text-xs font-semibold uppercase tracking-wide text-tertiary">
        Grammar Tags
      </legend>
      <p className="mt-1 text-xs text-tertiary">
        Waehle Grammatik-Tags aus der DaZ-Taxonomie.
      </p>

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Tag suchen (ID oder Bezeichnung)"
        className={INPUT_CLASS}
      />

      {query.trim().length > 0 && (
        <div className="mt-2 max-h-56 overflow-auto rounded-md border border-primary bg-primary">
          {matches.length > 0 ? (
            <ul className="divide-y divide-primary">
              {matches.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => addTag(option.id)}
                    className="w-full px-3 py-2 text-left text-sm text-secondary hover:bg-secondary"
                  >
                    <div className="font-medium">{option.pathLabel}</div>
                    <div className="text-xs text-tertiary">{option.id}</div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-sm text-tertiary">Keine Treffer</div>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((id) => (
            <span
              key={id}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary bg-secondary px-2 py-1 text-xs text-secondary"
            >
              <span className="truncate" title={id}>
                {GRAMMAR_TAG_LABEL_BY_ID.get(id) ?? id}
              </span>
              <button
                type="button"
                onClick={() => removeTag(id)}
                className="text-tertiary hover:text-secondary"
                aria-label={`Tag ${id} entfernen`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </fieldset>
  );
}
