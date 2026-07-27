"use client";

import { useEffect, useState } from 'react';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import { RICH_TEXT_TYPE_GROUPS } from '@/lib/rich-text-types';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

export function RichTextAIModal({
  context,
  onClose,
  onGenerated,
  open,
}: {
  context: WorksheetContext;
  onClose: () => void;
  onGenerated: (html: string) => void;
  open: boolean;
}) {
  const [topic, setTopic] = useState('');
  const [textType, setTextType] = useState('');
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTopic('');
    setTextType('');
    setGenerationContext({
      ...EMPTY_WORKSHEET_CONTEXT,
      ...context,
    });
    setPending(false);
    setError('');
  }, [context, open]);

  async function generate() {
    if (!topic.trim()) {
      setError('Enter a topic or draft title.');
      return;
    }
    if (!textType) {
      setError('Choose a Textsorte.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/rich-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          textType,
          context: generationContext,
        }),
      });
      const result = await response.json() as {
        html?: string;
        error?: string;
      };
      if (!response.ok || !result.html) {
        throw new Error(result.error ?? 'Could not generate the text.');
      }
      onGenerated(result.html);
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Could not generate the text.');
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
      title="Generate Rich Text with Eduit AI"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">
        Text settings
      </h3>
      <section className="grid grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)] items-start gap-4 rounded-xl border border-secondary bg-secondary p-5">
        <label className="block text-sm font-semibold text-primary">
          Topic / draft title
          <input
            autoFocus
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="What should the text be about?"
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="block text-sm font-semibold text-primary">
          Textsorte
          <select
            value={textType}
            onChange={(event) => setTextType(event.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          >
            <option value="">Textsorte wählen…</option>
            {RICH_TEXT_TYPE_GROUPS.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.types.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </section>

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
