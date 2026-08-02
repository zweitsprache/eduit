import Link from 'next/link';
import { Download01, File02, Loading01, Trash01 } from '@untitledui/icons';
import { Files } from 'lucide-react';
import type { Worksheet } from '@/lib/worksheets';

export function WorksheetCard({
  worksheet,
  compact = false,
  deleting = false,
  onDelete,
}: {
  worksheet: Worksheet;
  compact?: boolean;
  deleting?: boolean;
  onDelete?: (worksheet: Worksheet) => void;
}) {
  return (
    <article className={`worksheet-card${compact ? ' worksheet-card--compact' : ''}`}>
      <Link
        className={`card-preview preview-${worksheet.color}`}
        href={`/documents/${worksheet.slug}`}
        aria-label={`${worksheet.title} ansehen`}
      >
        {worksheet.thumbnailUrls?.[0]
          ? <img src={worksheet.thumbnailUrls[0]} alt="" />
          : (
            <>
              <File02 aria-hidden="true" />
              <span>16:9 Vorschau</span>
            </>
          )}
      </Link>
      <div className="card-body">
        <div className="card-flags">
          <span className={`subject subject-${worksheet.color}`}>{worksheet.documentType}</span>
          {Boolean(worksheet.relationships?.length) && (
            <span className="related-badge">Arbeitsblatt-Reihe</span>
          )}
          {worksheet.hasAnswerKey && <span className="answer-key">✓ Mit Lösungsblatt</span>}
        </div>
        <h2><Link href={`/documents/${worksheet.slug}`}>{worksheet.title}</Link></h2>
        <p className="card-excerpt">
          <Link href={`/documents/${worksheet.slug}`}>{worksheet.description}</Link>
        </p>
        <div className={`card-actions${onDelete ? '' : ' card-actions--no-delete'}`}>
          <div className="card-stats">
            <span><Files aria-hidden="true" /> {worksheet.pages}</span>
            <span><Download01 aria-hidden="true" /> {worksheet.downloads}</span>
          </div>
          {onDelete && (
            <button
              aria-label={`${worksheet.title} löschen`}
              className="card-delete"
              disabled={deleting}
              onClick={() => onDelete(worksheet)}
              title="Veröffentlichung löschen"
              type="button"
            >
              {deleting ? <Loading01 aria-hidden="true" /> : <Trash01 aria-hidden="true" />}
            </button>
          )}
          <Link className="card-details" href={`/documents/${worksheet.slug}`}>Details</Link>
          {worksheet.pdfUrl
            ? <a href={worksheet.pdfUrl} target="_blank" rel="noreferrer">Download</a>
            : <button type="button">Download</button>}
        </div>
      </div>
    </article>
  );
}
