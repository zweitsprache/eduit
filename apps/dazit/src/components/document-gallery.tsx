'use client';

import { useRef, useState } from 'react';
import { File02 } from '@untitledui/icons';

export function DocumentGallery({
  color,
  pages,
  thumbnailUrls,
}: {
  color: string;
  pages: number;
  thumbnailUrls?: string[];
}) {
  const [activePage, setActivePage] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const activeThumbnail = thumbnailUrls?.[activePage];
  const changePage = (direction: -1 | 1) => {
    setActivePage((current) => Math.min(pages - 1, Math.max(0, current + direction)));
  };
  return (
    <div className="document-viewer">
      <div
        className={`document-canvas preview-${color}`}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const distance = event.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(distance) >= 40) changePage(distance < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
      >
        {activeThumbnail
          ? (
            <img
              key={activeThumbnail}
              src={activeThumbnail}
              alt={`Vorschau Seite ${activePage + 1} von ${pages} zu diesem Dokument`}
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
            />
          )
          : (
            <>
              <File02 aria-hidden="true" />
              <span>16:9 Vorschau — Seite {activePage + 1}</span>
            </>
          )}
      </div>
      <div className="page-buttons" aria-label="Vorschauseiten">
        {Array.from({ length: pages }, (_, index) => (
          <button
            aria-label={`Seite ${index + 1} anzeigen`}
            className={index === activePage ? 'active' : ''}
            key={index}
            onClick={() => setActivePage(index)}
            type="button"
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
