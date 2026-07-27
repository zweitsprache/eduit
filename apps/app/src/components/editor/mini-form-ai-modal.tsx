"use client";

import { useEffect, useState } from 'react';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { Toggle } from '@/components/base/toggle/toggle';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import {
  ContentAddButton,
  ContentCard,
  ContentItemActions,
  ContentItemNumber,
} from '@/components/editor/content-modal-ui';
import type { MiniFormField } from '@/components/editor/mini-form-node';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

type FieldDraft = MiniFormField & {
  guidance: string;
};

type MiniFormTextType =
  | 'narrative'
  | 'direct-formal'
  | 'direct-informal'
  | 'messenger-message'
  | 'email';

export type GeneratedMiniFormItem = {
  prompt: string;
  values: string[];
};

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const result = [...items];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}

export function MiniFormAIModal({
  context,
  fields,
  initialItemCount,
  onClose,
  onGenerated,
  open,
}: {
  context: WorksheetContext;
  fields: MiniFormField[];
  initialItemCount: number;
  onClose: () => void;
  onGenerated: (result: {
    fields: FieldDraft[];
    items: GeneratedMiniFormItem[];
  }) => void;
  open: boolean;
}) {
  const [topic, setTopic] = useState('');
  const [itemCount, setItemCount] = useState(3);
  const [autoItemCount, setAutoItemCount] = useState(false);
  const [textType, setTextType] = useState<MiniFormTextType>('narrative');
  const [fieldDrafts, setFieldDrafts] = useState<FieldDraft[]>([]);
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTopic('');
    setItemCount(Math.min(12, Math.max(1, initialItemCount)));
    setAutoItemCount(false);
    setTextType('narrative');
    setFieldDrafts(fields.map((field) => ({ ...field, guidance: '' })));
    setGenerationContext({
      ...EMPTY_WORKSHEET_CONTEXT,
      ...context,
    });
    setPending(false);
    setError('');
  }, [context, fields, initialItemCount, open]);

  function updateField(id: string, patch: Partial<FieldDraft>) {
    setFieldDrafts((current) => current.map((field) => (
      field.id === id ? { ...field, ...patch } : field
    )));
  }

  async function generate() {
    if (!topic.trim()) {
      setError('Enter a topic or scenario for the mini-forms.');
      return;
    }
    if (fieldDrafts.some(({ label }) => !label.trim())) {
      setError('Enter a label for every field.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/mini-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          itemCount: autoItemCount ? null : itemCount,
          textType,
          fields: fieldDrafts.map(({ label, guidance }) => ({
            label: label.trim(),
            guidance: guidance.trim(),
          })),
          context: generationContext,
        }),
      });
      const result = await response.json() as {
        items?: GeneratedMiniFormItem[];
        error?: string;
      };
      if (!response.ok || !result.items) {
        throw new Error(result.error ?? 'Could not generate the mini-forms.');
      }
      onGenerated({ fields: fieldDrafts, items: result.items });
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Could not generate the mini-forms.');
      setPending(false);
    }
  }

  return (
    <AIGenerationModal
      error={error}
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      title="Generate Mini Forms with Eduit AI"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">
        Mini-form settings
      </h3>
      <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-xl border border-secondary bg-secondary p-5">
        <label className="block text-sm font-semibold text-primary">
          Topic / scenario
          <input
            autoFocus
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="What information should learners extract?"
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
        <div>
          <p className="text-sm font-semibold text-primary">
            Number of mini-forms
          </p>
          <div className="mt-2 flex h-10 items-center gap-4">
            <Toggle
              label="Auto"
              isSelected={autoItemCount}
              onChange={setAutoItemCount}
            />
            <input
              aria-label="Number of mini-forms"
              type="number"
              min={1}
              max={12}
              disabled={autoItemCount}
              value={itemCount}
              onChange={(event) => setItemCount(
                Math.min(12, Math.max(1, Number(event.target.value) || 1)),
              )}
              className="h-10 w-24 rounded-md border border-primary bg-primary px-3 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:bg-disabled_subtle disabled:text-disabled"
            />
          </div>
        </div>
        <label className="block text-sm font-semibold text-primary">
          Textsorte
          <select
            value={textType}
            onChange={(event) => setTextType(
              event.target.value as MiniFormTextType,
            )}
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          >
            <option value="narrative">Erzähltext</option>
            <option value="direct-formal">
              Direkte formelle Ansprache
            </option>
            <option value="direct-informal">
              Direkte informelle Ansprache
            </option>
            <option value="messenger-message">Messenger message</option>
            <option value="email">E-Mail</option>
          </select>
        </label>
      </section>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-primary">Fields</h3>
          <span className="text-xs font-semibold text-quaternary">
            {fieldDrafts.length} fields
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {fieldDrafts.map((field, index) => (
            <ContentCard key={field.id}>
              <div className="grid grid-cols-[auto_minmax(0,0.8fr)_minmax(0,1.2fr)_auto] items-start gap-3">
                <span className="mt-6">
                  <ContentItemNumber>
                    {String(index + 1).padStart(2, '0')}
                  </ContentItemNumber>
                </span>
                <label className="min-w-0 text-xs font-semibold text-tertiary">
                  Field label
                  <input
                    value={field.label}
                    onChange={(event) => updateField(field.id, {
                      label: event.target.value,
                    })}
                    className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </label>
                <label className="min-w-0 text-xs font-semibold text-tertiary">
                  Generation guidance <span className="font-normal">(optional)</span>
                  <input
                    value={field.guidance}
                    onChange={(event) => updateField(field.id, {
                      guidance: event.target.value,
                    })}
                    placeholder="What value should AI provide?"
                    className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </label>
                <div className="mt-5">
                  <ContentItemActions
                    label={`field ${index + 1}`}
                    canDelete={fieldDrafts.length > 1}
                    canMoveUp={index > 0}
                    canMoveDown={index < fieldDrafts.length - 1}
                    onDelete={() => setFieldDrafts(fieldDrafts.filter(
                      ({ id }) => id !== field.id,
                    ))}
                    onMoveUp={() => setFieldDrafts(moveItem(
                      fieldDrafts,
                      index,
                      -1,
                    ))}
                    onMoveDown={() => setFieldDrafts(moveItem(
                      fieldDrafts,
                      index,
                      1,
                    ))}
                  />
                </div>
              </div>
            </ContentCard>
          ))}
        </div>
        <ContentAddButton
          disabled={fieldDrafts.length >= 8}
          onClick={() => setFieldDrafts([...fieldDrafts, {
            id: `mini-form-ai-field-${Date.now()}`,
            label: `Field ${fieldDrafts.length + 1}`,
            guidance: '',
          }])}
        >
          Add field
        </ContentAddButton>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-primary">
          Generation context
        </h3>
        <div className="mt-4">
          <DocumentContextFields
            context={generationContext}
            expandMoreContext
            twoColumns
            onChange={(patch) => setGenerationContext({
              ...generationContext,
              ...patch,
            })}
          />
        </div>
      </div>
    </AIGenerationModal>
  );
}
