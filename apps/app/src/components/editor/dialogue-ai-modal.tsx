"use client";

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import { Toggle } from '@/components/base/toggle/toggle';
import type {
  DialogueSpeaker,
  DialogueSpeakerNames,
} from '@/components/editor/dialogue-node';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

type SpeakerProfile = {
  name: string;
  role: string;
  demeanor: string;
};

export type GeneratedDialogue = {
  items: Array<{
    speaker: DialogueSpeaker;
    text: string;
  }>;
  speakerNames: string[];
};

function initialProfiles(
  speakerNames: DialogueSpeakerNames,
): SpeakerProfile[] {
  return ([1, 2, 3, 4] as DialogueSpeaker[]).map((speaker) => ({
    name: speakerNames[speaker] || `Speaker ${speaker}`,
    role: '',
    demeanor: '',
  }));
}

export function DialogueAIModal({
  context,
  initialSpeakerCount,
  onClose,
  onGenerated,
  open,
  speakerNames,
}: {
  context: WorksheetContext;
  initialSpeakerCount: number;
  onClose: () => void;
  onGenerated: (dialogue: GeneratedDialogue) => void;
  open: boolean;
  speakerNames: DialogueSpeakerNames;
}) {
  const [topic, setTopic] = useState('');
  const [speakerCount, setSpeakerCount] = useState(2);
  const [includeBlanks, setIncludeBlanks] = useState(true);
  const [blankFocus, setBlankFocus] = useState('');
  const [speakers, setSpeakers] = useState<SpeakerProfile[]>(
    initialProfiles(speakerNames),
  );
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTopic('');
    setSpeakerCount(Math.min(4, Math.max(2, initialSpeakerCount)));
    setIncludeBlanks(true);
    setBlankFocus('');
    setSpeakers(initialProfiles(speakerNames));
    setGenerationContext({
      ...EMPTY_WORKSHEET_CONTEXT,
      ...context,
    });
    setPending(false);
    setError('');
  }, [context, initialSpeakerCount, open, speakerNames]);

  function updateSpeaker(index: number, patch: Partial<SpeakerProfile>) {
    setSpeakers((current) => current.map((speaker, speakerIndex) => (
      speakerIndex === index ? { ...speaker, ...patch } : speaker
    )));
  }

  async function generate() {
    if (!topic.trim()) {
      setError('Enter a topic for the dialogue.');
      return;
    }
    const activeSpeakers = speakers.slice(0, speakerCount);
    if (activeSpeakers.some(({ name, role }) => !name.trim() || !role.trim())) {
      setError('Enter a name and role for every speaker.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          speakers: activeSpeakers,
          includeBlanks,
          blankFocus: includeBlanks ? blankFocus.trim() : '',
          context: generationContext,
        }),
      });
      const result = await response.json() as {
        items?: GeneratedDialogue['items'];
        speakerNames?: string[];
        error?: string;
      };
      if (!response.ok || !result.items || !result.speakerNames) {
        throw new Error(result.error ?? 'Could not generate the dialogue.');
      }
      onGenerated({
        items: result.items,
        speakerNames: result.speakerNames,
      });
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Could not generate the dialogue.');
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
      title="Generate Dialogue with Eduit AI"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">
        Dialogue settings
      </h3>
      <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-xl border border-secondary bg-secondary p-5">
        <label className="block text-sm font-semibold text-primary">
          Topic
          <input
            autoFocus
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="What should the dialogue be about?"
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="block w-36 text-sm font-semibold text-primary">
          Number of speakers
          <input
            type="number"
            min={2}
            max={4}
            value={speakerCount}
            onChange={(event) => setSpeakerCount(
              Math.min(4, Math.max(2, Number(event.target.value) || 2)),
            )}
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
        <div className="col-span-2 grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-t border-secondary pt-4">
          <div>
            <p className="text-xs font-semibold text-tertiary">Blanks</p>
            <div className="mt-1.5 flex h-9 items-center">
              <Toggle
                label="Include"
                isSelected={includeBlanks}
                onChange={setIncludeBlanks}
              />
            </div>
          </div>
          {includeBlanks && (
            <label className="min-w-0 text-xs font-semibold text-tertiary">
              Blank focus
              <input
                type="text"
                value={blankFocus}
                onChange={(event) => setBlankFocus(event.target.value)}
                placeholder="e.g. key vocabulary, verb forms, polite phrases"
                className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </label>
          )}
        </div>
      </section>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-primary">Speakers</h3>
          <span className="text-xs font-semibold text-quaternary">
            {speakerCount} speakers
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {speakers.slice(0, speakerCount).map((speaker, index) => (
            <div
              className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] items-end gap-3 rounded-lg border border-secondary bg-secondary p-3"
              key={index}
            >
              <span className="mb-2.5 flex size-7 items-center justify-center rounded-md bg-primary text-tertiary">
                <User className="size-4" />
              </span>
              <label className="block text-xs font-semibold text-tertiary">
                Name
                <input
                  value={speaker.name}
                  onChange={(event) => updateSpeaker(index, {
                    name: event.target.value,
                  })}
                  className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
              </label>
              <label className="block text-xs font-semibold text-tertiary">
                Role
                <input
                  value={speaker.role}
                  onChange={(event) => updateSpeaker(index, {
                    role: event.target.value,
                  })}
                  placeholder="e.g. customer"
                  className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
              </label>
              <label className="block text-xs font-semibold text-tertiary">
                Demeanor <span className="font-normal">(optional)</span>
                <input
                  value={speaker.demeanor}
                  onChange={(event) => updateSpeaker(index, {
                    demeanor: event.target.value,
                  })}
                  placeholder="e.g. patient"
                  className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
              </label>
            </div>
          ))}
        </div>
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
