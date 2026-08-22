"use client";

import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronUp,
  Image01,
  Loading01,
  PlusSquare,
  Trash01,
  XClose,
} from '@untitledui/icons';
import {
  Bold,
  Italic,
  Link,
  List as ListIcon,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import {
  ContentCard,
  ContentFieldLabel,
  ContentOptionButtonGroup,
  ContentSectionHeader,
} from '@/components/editor/content-modal-ui';
import { Toggle } from '@/components/base/toggle/toggle';
import { MediaLibraryModal } from '@/components/editor/media-library-modal';
import {
  MediaLayoutContent,
  type MediaLayoutAttrs,
  type MediaLayoutItem,
} from '@/components/editor/media-layout-node';
import type { UserMedia } from '@/lib/media';

type MediaBlock = { pos: number; type: 'mediaLayout' };

function updateAttrs(
  editor: Editor,
  block: MediaBlock,
  patch: Partial<MediaLayoutAttrs>,
) {
  editor.chain().command(({ tr }) => {
    const node = tr.doc.nodeAt(block.pos);
    if (node?.type.name !== block.type) return false;
    Object.entries(patch).forEach(([key, value]) => {
      tr.setNodeAttribute(block.pos, key, value);
    });
    return true;
  }).run();
}

function moveItem(items: MediaLayoutItem[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const inputClass =
  'h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm text-secondary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand';
const MAX_AI_PROMPT_LENGTH = 1500;

function textPreview(value: string) {
  if (typeof document === 'undefined') return value.replace(/<[^>]+>/g, ' ');
  const element = document.createElement('div');
  element.innerHTML = value;
  return element.textContent ?? '';
}

function mediaDimensions(aspectRatio: MediaLayoutAttrs['aspectRatio']) {
  if (aspectRatio === 'square') return { width: 1024, height: 1024 };
  if (aspectRatio === 'wide') return { width: 1024, height: 576 };
  if (aspectRatio === 'three-two') return { width: 1024, height: 680 };
  return { width: 1024, height: 768 };
}

function MediaRichTextEditor({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input || document.activeElement === input || input.innerHTML === value) {
      return;
    }
    input.innerHTML = value;
  }, [value]);

  const run = (command: string, commandValue?: string) => {
    inputRef.current?.focus();
    document.execCommand(command, false, commandValue);
    if (inputRef.current) onChange(inputRef.current.innerHTML);
  };

  const tools = [
    { label: 'Bold', icon: Bold, action: () => run('bold') },
    { label: 'Italic', icon: Italic, action: () => run('italic') },
    { label: 'Bulleted list', icon: ListIcon, action: () => run('insertUnorderedList') },
    { label: 'Numbered list', icon: ListOrdered, action: () => run('insertOrderedList') },
    {
      label: 'Link',
      icon: Link,
      action: () => {
        const url = window.prompt('Link URL', 'https://');
        if (url?.trim()) run('createLink', url.trim());
      },
    },
  ];

  return (
    <div className="mt-1.5 overflow-hidden rounded-md border border-primary bg-primary focus-within:border-brand focus-within:ring-2 focus-within:ring-brand">
      <div className="flex items-center gap-0.5 border-b border-secondary p-1">
        {tools.map(({ action, icon: Icon, label }) => (
          <button
            type="button"
            aria-label={label}
            title={label}
            key={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={action}
            className="flex size-8 items-center justify-center rounded-md text-quaternary hover:bg-primary_hover hover:text-secondary"
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
      <div
        ref={inputRef}
        role="textbox"
        aria-label="Text"
        aria-multiline="true"
        contentEditable
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="min-h-32 px-3 py-2 text-sm leading-6 text-secondary outline-none [&_a]:text-brand-secondary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-0 [&_ul]:list-disc [&_ul]:pl-5"
        suppressContentEditableWarning
      />
    </div>
  );
}

export function MediaLayoutEditorModal({
  block,
  editor,
  onClose,
}: {
  block: MediaBlock | null;
  editor: Editor;
  onClose: () => void;
}) {
  const [selectingItemId, setSelectingItemId] = useState<string | null>(null);
  const [aiPrompts, setAiPrompts] = useState<Record<string, string>>({});
  const [generatingItemId, setGeneratingItemId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState('');
  const attrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!block) return null;
      const node = currentEditor.state.doc.nodeAt(block.pos);
      return node?.type.name === 'mediaLayout'
        ? node.attrs as MediaLayoutAttrs
        : null;
    },
  });

  useEffect(() => {
    if (!block) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !selectingItemId) onClose();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [block, onClose, selectingItemId]);

  if (!block || !attrs || typeof document === 'undefined') return null;
  const set = (patch: Partial<MediaLayoutAttrs>) => (
    updateAttrs(editor, block, patch)
  );
  const updateItem = (id: string, patch: Partial<MediaLayoutItem>) => {
    set({
      items: attrs.items.map((item) => (
        item.id === id ? { ...item, ...patch } : item
      )),
    });
  };
  const promptForItem = (item: MediaLayoutItem) => (
    Object.prototype.hasOwnProperty.call(aiPrompts, item.id)
      ? aiPrompts[item.id]
      : (item.alt || item.caption || textPreview(attrs.text)).slice(0, MAX_AI_PROMPT_LENGTH)
  );
  const generateImage = async (item: MediaLayoutItem) => {
    const prompt = promptForItem(item).trim().slice(0, MAX_AI_PROMPT_LENGTH);
    if (!prompt) {
      setGenerationError('Describe the image you want to generate.');
      return;
    }
    setGeneratingItemId(item.id);
    setGenerationError('');
    try {
      const response = await fetch('/api/ai/media-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mediaDimensions(attrs.aspectRatio),
          prompt,
          alt: item.alt || prompt.slice(0, 500),
          name: item.caption || item.alt || 'AI generated image',
        }),
      });
      const result = await response.json() as {
        media?: UserMedia;
        error?: string;
      };
      if (!response.ok || !result.media) {
        throw new Error(result.error ?? 'Could not generate image.');
      }
      updateItem(item.id, {
        src: result.media.src,
        alt: result.media.alt || item.alt || prompt,
      });
    } catch (error) {
      setGenerationError(error instanceof Error
        ? error.message
        : 'Could not generate image.');
    } finally {
      setGeneratingItemId(null);
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Media layout content"
          className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl"
        >
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary px-6">
            <h2 className="text-base font-semibold text-primary">
              Media layout content
            </h2>
            <button
              type="button"
              aria-label="Close content editor"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-lg text-quaternary hover:bg-primary_hover hover:text-secondary"
            >
              <XClose className="size-5" />
            </button>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(24rem,0.9fr)_minmax(30rem,1.1fr)] overflow-hidden">
            <div className="overflow-y-auto border-r border-secondary p-6">
              <ContentSectionHeader className="">Layout</ContentSectionHeader>
              <ContentOptionButtonGroup
                ariaLabel="Media layout"
                value={attrs.layout}
                onChange={(value) => set({
                  layout: value as MediaLayoutAttrs['layout'],
                })}
                options={[
                  { value: 'full', label: 'Full width' },
                  { value: 'image-left', label: 'Image left' },
                  { value: 'image-right', label: 'Image right' },
                  { value: 'grid', label: 'Grid' },
                ]}
              />

              {attrs.layout === 'grid' && (
                <>
                  <ContentFieldLabel className="mt-4">Columns</ContentFieldLabel>
                  <ContentOptionButtonGroup
                    ariaLabel="Grid columns"
                    value={String(attrs.columns)}
                    onChange={(value) => set({
                      columns: Number(value) as MediaLayoutAttrs['columns'],
                    })}
                    options={[1, 2, 3, 4].map((value) => ({
                      value: String(value),
                      label: String(value),
                    }))}
                  />
                </>
              )}

              {(attrs.layout === 'image-left'
                || attrs.layout === 'image-right') && (
                <>
                  <ContentFieldLabel className="mt-4">Image width</ContentFieldLabel>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[20, 25, 33, 50, 66, 75, 80].map((value) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => set({ imageWidth: value })}
                        className={[
                          'h-9 rounded-md border px-1 text-sm font-semibold transition',
                          attrs.imageWidth === value
                            ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                            : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
                        ].join(' ')}
                      >
                        {value}%
                      </button>
                    ))}
                    <label className="relative">
                      <input
                        type="number"
                        min={1}
                        max={99}
                        step={1}
                        aria-label="Custom image width percentage"
                        value={attrs.imageWidth}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isFinite(value)) {
                            set({
                              imageWidth: Math.min(99, Math.max(1, value)),
                            });
                          }
                        }}
                        className="h-9 w-full rounded-md border border-primary bg-primary pl-2 pr-6 text-sm font-semibold text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-quaternary">
                        %
                      </span>
                    </label>
                  </div>
                </>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold text-secondary">
                  Aspect ratio
                  <select
                    value={attrs.aspectRatio}
                    onChange={(event) => set({
                      aspectRatio: event.target.value as MediaLayoutAttrs['aspectRatio'],
                    })}
                    className={`${inputClass} mt-1.5`}
                  >
                    <option value="auto">Original</option>
                    <option value="square">1:1</option>
                    <option value="four-three">4:3</option>
                    <option value="three-two">3:2</option>
                    <option value="wide">16:9</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-secondary">
                  Image fit
                  <select
                    value={attrs.fit}
                    onChange={(event) => set({
                      fit: event.target.value as MediaLayoutAttrs['fit'],
                    })}
                    className={`${inputClass} mt-1.5`}
                  >
                    <option value="cover">Crop to fill</option>
                    <option value="contain">Show entire image</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-secondary">
                  Gap
                  <select
                    value={attrs.gap}
                    onChange={(event) => set({
                      gap: event.target.value as MediaLayoutAttrs['gap'],
                    })}
                    className={`${inputClass} mt-1.5`}
                  >
                    <option value="none">None</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-secondary">
                  Corners
                  <select
                    value={attrs.radius}
                    onChange={(event) => set({
                      radius: event.target.value as MediaLayoutAttrs['radius'],
                    })}
                    className={`${inputClass} mt-1.5`}
                  >
                    <option value="none">Square</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </label>
              </div>
              <Toggle
                className="mt-4"
                isSelected={attrs.showCaptions}
                onChange={(value) => set({ showCaptions: value })}
                label="Show captions and credits"
              />

              {(attrs.layout === 'image-left'
                || attrs.layout === 'image-right') && (
                <>
                  <ContentSectionHeader>Text</ContentSectionHeader>
                  <div className="mt-3">
                    <MediaRichTextEditor
                      value={attrs.text}
                      onChange={(text) => set({ text })}
                    />
                  </div>
                  <ContentFieldLabel className="mt-3">Vertical alignment</ContentFieldLabel>
                  <ContentOptionButtonGroup
                    ariaLabel="Text vertical alignment"
                    value={attrs.textVertical}
                    onChange={(value) => set({
                      textVertical: value as MediaLayoutAttrs['textVertical'],
                    })}
                    options={[
                      { value: 'start', label: 'Top' },
                      { value: 'center', label: 'Centre' },
                      { value: 'end', label: 'Bottom' },
                    ]}
                  />
                </>
              )}

              <ContentSectionHeader count={attrs.items.length}>
                Images
              </ContentSectionHeader>
              <div className="mt-3 space-y-3">
                {attrs.items.map((item, index) => (
                  <ContentCard key={item.id}>
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectingItemId(item.id)}
                        className="relative size-20 shrink-0 overflow-hidden rounded-md border border-primary bg-primary"
                      >
                        {item.src ? (
                          <img
                            alt=""
                            src={item.src}
                            className="size-full object-cover"
                          />
                        ) : (
                          <Image01 className="absolute inset-0 m-auto size-5 text-quaternary" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <input
                          aria-label={`Image ${index + 1} URL`}
                          value={item.src}
                          onChange={(event) => updateItem(item.id, {
                            src: event.target.value,
                          })}
                          className={inputClass}
                          placeholder="Image URL"
                        />
                        <input
                          aria-label={`Image ${index + 1} alternative text`}
                          value={item.alt}
                          onChange={(event) => updateItem(item.id, {
                            alt: event.target.value,
                          })}
                          className={`${inputClass} mt-2`}
                          placeholder="Alternative text"
                        />
                        <div className="mt-2 rounded-md border border-secondary bg-secondary p-2">
                          <label className="text-xs font-semibold text-tertiary">
                            Eduit AI prompt
                            <textarea
                              value={promptForItem(item)}
                              onChange={(event) => setAiPrompts((current) => ({
                                ...current,
                                [item.id]: event.target.value.slice(0, MAX_AI_PROMPT_LENGTH),
                              }))}
                              maxLength={MAX_AI_PROMPT_LENGTH}
                              className="mt-1.5 min-h-16 w-full resize-y rounded-md border border-primary bg-primary px-2.5 py-2 text-sm font-normal text-secondary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand"
                              placeholder="Illustration of two learners practising German vocabulary"
                            />
                          </label>
                          <button
                            type="button"
                            disabled={generatingItemId !== null}
                            onClick={() => void generateImage(item)}
                            className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-brand-solid px-3 text-sm font-semibold text-white hover:bg-brand-solid_hover disabled:cursor-wait disabled:opacity-60"
                          >
                            {generatingItemId === item.id
                              ? <Loading01 className="size-4 animate-spin" />
                              : <Sparkles className="size-4" />}
                            {generatingItemId === item.id ? 'Generating…' : 'Generate image'}
                          </button>
                        </div>
                      </div>
                      <div className="flex shrink-0">
                        <button
                          type="button"
                          aria-label={`Move image ${index + 1} up`}
                          disabled={index === 0}
                          onClick={() => set({
                            items: moveItem(attrs.items, index, -1),
                          })}
                          className="flex size-8 items-center justify-center text-quaternary disabled:opacity-25"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move image ${index + 1} down`}
                          disabled={index === attrs.items.length - 1}
                          onClick={() => set({
                            items: moveItem(attrs.items, index, 1),
                          })}
                          className="flex size-8 items-center justify-center text-quaternary disabled:opacity-25"
                        >
                          <ChevronDown className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete image ${index + 1}`}
                          disabled={attrs.items.length === 1}
                          onClick={() => set({
                            items: attrs.items.filter(({ id }) => id !== item.id),
                          })}
                          className="flex size-8 items-center justify-center text-quaternary hover:text-error-primary disabled:opacity-25"
                        >
                          <Trash01 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        value={item.caption}
                        onChange={(event) => updateItem(item.id, {
                          caption: event.target.value,
                        })}
                        className={inputClass}
                        placeholder="Caption"
                      />
                      <input
                        value={item.credit}
                        onChange={(event) => updateItem(item.id, {
                          credit: event.target.value,
                        })}
                        className={inputClass}
                        placeholder="Credit / source"
                      />
                      <input
                        value={item.href}
                        onChange={(event) => updateItem(item.id, {
                          href: event.target.value,
                        })}
                        className="col-span-2 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm text-secondary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand"
                        placeholder="Optional link URL"
                      />
                    </div>
                    {attrs.fit === 'cover' && (
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <label className="text-xs font-semibold text-tertiary">
                          Horizontal focus
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={item.focalX}
                            onChange={(event) => updateItem(item.id, {
                              focalX: Number(event.target.value),
                            })}
                            className="mt-1 block w-full accent-[var(--color-brand-600)]"
                          />
                        </label>
                        <label className="text-xs font-semibold text-tertiary">
                          Vertical focus
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={item.focalY}
                            onChange={(event) => updateItem(item.id, {
                              focalY: Number(event.target.value),
                            })}
                            className="mt-1 block w-full accent-[var(--color-brand-600)]"
                          />
                        </label>
                      </div>
                    )}
                  </ContentCard>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const id = `media-item-${Date.now()}`;
                  set({
                    items: [...attrs.items, {
                      id,
                      src: '',
                      alt: '',
                      caption: '',
                      credit: '',
                      href: '',
                      focalX: 50,
                      focalY: 50,
                    }],
                  });
                  setSelectingItemId(id);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
              >
                <PlusSquare className="size-4" />
                Add image
              </button>
              {generationError && (
                <p className="mt-3 rounded-md border border-error-secondary bg-error-primary/5 px-3 py-2 text-sm text-error-primary">
                  {generationError}
                </p>
              )}
            </div>

            <div className="overflow-y-auto bg-primary p-6">
              <p className="mb-4 text-sm font-semibold text-secondary">Preview</p>
              <div className="mx-auto w-full max-w-[48rem]">
                <MediaLayoutContent attrs={attrs} />
              </div>
            </div>
          </div>
          <footer className="flex h-16 shrink-0 items-center justify-end border-t border-secondary px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover"
            >
              Done
            </button>
          </footer>
        </div>
      </div>
      <MediaLibraryModal
        open={selectingItemId !== null}
        onClose={() => setSelectingItemId(null)}
        onSelect={(image) => {
          if (selectingItemId) updateItem(selectingItemId, image);
          setSelectingItemId(null);
        }}
      />
    </>,
    document.body,
  );
}
