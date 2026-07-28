"use client";

import { useEffect, useState } from 'react';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import { TextTypeSelect } from '@/components/editor/text-type-select';
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
  const [challengeFocus, setChallengeFocus] = useState('');
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTopic('');
    setTextType('');
    setChallengeFocus('');
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
          challengeFocus: challengeFocus.trim(),
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
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)] items-start gap-4">
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
          <TextTypeSelect
            value={textType}
            onChange={setTextType}
          />
        </div>
        <label className="mt-4 block border-t border-secondary pt-4 text-xs font-semibold text-tertiary">
          Challenge focus <span className="font-normal">(optional)</span>
          <textarea
            rows={3}
            maxLength={1_000}
            value={challengeFocus}
            onChange={(event) => setChallengeFocus(event.target.value)}
            placeholder="e.g. separable verbs, temporal sequence, distinguishing cause and consequence, formal register…"
            className="mt-1.5 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal leading-6 text-secondary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand"
          />
          <span className="mt-1 block font-normal leading-5 text-quaternary">
            The text will use this linguistic, semantic, pragmatic, or
            discourse challenge extensively and in varied natural contexts.
          </span>
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
