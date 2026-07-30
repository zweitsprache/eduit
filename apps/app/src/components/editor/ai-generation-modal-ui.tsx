"use client";

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Loading01, XClose } from '@untitledui/icons';
import { WandSparkles } from 'lucide-react';
import { useAIModalLocalization } from '@/components/editor/ai-modal-localization';

export function AIGenerationModal({
  children,
  error,
  generateLabel = 'Generate',
  onClose,
  onGenerate,
  open,
  pending,
  progressLabel,
  title,
}: {
  children: ReactNode;
  error?: string;
  generateLabel?: string;
  onClose: () => void;
  onGenerate: () => void;
  open: boolean;
  pending: boolean;
  progressLabel?: string;
  title: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useAIModalLocalization(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open, pending]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary px-6">
          <div className="flex items-center gap-2.5">
            <WandSparkles className="size-5 text-brand-secondary" />
            <h2 className="text-base font-semibold text-primary">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close AI generator"
            disabled={pending}
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-quaternary hover:bg-primary_hover hover:text-secondary disabled:opacity-50"
          >
            <XClose className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl p-6">
            {children}
            {error && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-error-primary bg-error-primary p-3 text-sm text-error-primary"
              >
                {error}
              </div>
            )}
          </div>
        </div>

        <footer className="flex h-16 shrink-0 items-center justify-end gap-2 border-t border-secondary px-6">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onGenerate}
            className="flex min-w-32 items-center justify-center gap-2 rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover disabled:opacity-60"
          >
            {pending ? <Loading01 className="size-4 animate-spin" /> : (
              <WandSparkles className="size-4" />
            )}
            <span
              key={pending ? (progressLabel || 'Generating…') : generateLabel}
              className={pending ? 'ai-generation-progress-label' : undefined}
            >
              {pending ? (progressLabel || 'Generating…') : generateLabel}
            </span>
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
