"use client";

import { Image01, UploadCloud01, XClose } from '@untitledui/icons';

type MediaLibraryModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (image: { src: string; alt: string }) => void;
};

const PLACEHOLDER_IMAGE = {
  src: '/placeholders/rewrite-landscape.svg',
  alt: 'Worksheet illustration',
};

export function MediaLibraryModal({
  open,
  onClose,
  onSelect,
}: MediaLibraryModalProps) {
  if (!open) return null;

  return (
    <div
      aria-label="Media library"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4"
      role="dialog"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-secondary bg-primary shadow-xl">
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-primary">Media library</h2>
            <p className="mt-0.5 text-sm text-tertiary">
              Choose an image for this worksheet item.
            </p>
          </div>
          <button
            aria-label="Close media library"
            className="text-quaternary transition hover:text-secondary"
            onClick={onClose}
            type="button"
          >
            <XClose className="size-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <p className="text-xs font-semibold text-tertiary">Upload</p>
            <button
              className="mt-2 flex min-h-40 w-full flex-col items-center justify-center border border-dashed border-primary bg-secondary px-6 text-center"
              onClick={() => onSelect(PLACEHOLDER_IMAGE)}
              type="button"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary shadow-xs">
                <UploadCloud01 className="size-5 text-quaternary" />
              </span>
              <span className="mt-3 text-sm font-semibold text-secondary">
                Upload an image
              </span>
              <span className="mt-1 text-xs text-quaternary">
                Placeholder flow — storage will be connected later
              </span>
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-tertiary">Library</p>
            <button
              className="mt-2 w-full overflow-hidden border border-primary bg-secondary text-left transition hover:border-brand"
              onClick={() => onSelect(PLACEHOLDER_IMAGE)}
              type="button"
            >
              <img
                alt={PLACEHOLDER_IMAGE.alt}
                className="aspect-[4/3] w-full object-cover"
                src={PLACEHOLDER_IMAGE.src}
              />
              <span className="flex items-center gap-2 border-t border-primary px-3 py-2 text-xs font-medium text-secondary">
                <Image01 className="size-4 text-quaternary" />
                Placeholder image
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
