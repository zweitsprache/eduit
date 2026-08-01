'use client';

import { useState } from 'react';
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
  const activeThumbnail = thumbnailUrls?.[activePage];
  return (
    <div className="document-viewer">
      <div className={`document-canvas preview-${color}`}>
        {activeThumbnail
          ? <img src={activeThumbnail} alt={`Vorschau Seite ${activePage + 1}`} />
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
