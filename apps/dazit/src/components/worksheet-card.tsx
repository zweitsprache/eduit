import Link from 'next/link';
import { Download01, File02, Loading01, Trash01 } from '@untitledui/icons';
import { ArrowDownToLine, Check, Files, TextAlignJustify } from 'lucide-react';
import type { Worksheet } from '@/lib/worksheets';
import { DownloadAuthGate } from '@/components/download-auth-gate';

export function WorksheetCard({
  worksheet,
  compact = false,
  canDownload,
  deleting = false,
  onDelete,
}: {
  worksheet: Worksheet;
  compact?: boolean;
  canDownload?: boolean;
  deleting?: boolean;
  onDelete?: (worksheet: Worksheet) => void;
}) {
  const levelLabel = worksheet.level || worksheet.grade;

  return (
    <article className={`worksheet-card${compact ? ' worksheet-card--compact' : ''}`}>
      <div className="card-body">
        <div className="card-flags">
          {levelLabel && levelLabel !== '—' && (
            <span className={`level-badge level-${worksheet.color}`}>{levelLabel}</span>
          )}
          <span className={`subject subject-${worksheet.color}`}>{worksheet.documentType}</span>
          {Boolean(worksheet.relationships?.length) && (
            <span className="related-badge">Arbeitsblatt-Reihe</span>
          )}
          {worksheet.hasAnswerKey && (
            <span className="answer-key" aria-label="Lösungsblatt" title="Lösungsblatt">
              <Check aria-hidden="true" />
            </span>
          )}
          <time className="card-created-date" dateTime={worksheet.publishedAt}>{worksheet.added}</time>
        </div>
        <h2><Link href={`/documents/${worksheet.slug}`}>{worksheet.title}</Link></h2>
        <Link
          className={`card-preview preview-${worksheet.color}`}
          href={`/documents/${worksheet.slug}`}
          aria-label={`${worksheet.title} ansehen`}
        >
          {worksheet.actionField && (
            <span className={`card-action-field level-${worksheet.color}`} title={`Handlungsfeld: ${worksheet.actionField}`}>
              {worksheet.actionField}
            </span>
          )}
          {worksheet.thumbnailUrls?.[0]
            ? (
              <img
                src={worksheet.thumbnailUrls[0]}
                alt={`Vorschau: ${worksheet.title}`}
                width={1600}
                height={900}
                loading="lazy"
                decoding="async"
              />
            )
            : (
              <>
                <File02 aria-hidden="true" />
                <span>16:9 Vorschau</span>
              </>
            )}
        </Link>
        <p className="card-excerpt">
          <Link href={`/documents/${worksheet.slug}`}>{worksheet.description}</Link>
        </p>
        <div className={`card-actions${onDelete ? '' : ' card-actions--no-delete'}`}>
          <div className="card-stats">
            <span><Files aria-hidden="true" /> {worksheet.pages}</span>
            <span><Download01 aria-hidden="true" /> {worksheet.downloads}</span>
          </div>
          <div className="card-action-buttons">
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
            <Link
              aria-label={`${worksheet.title}: Details`}
              className="card-details"
              href={`/documents/${worksheet.slug}`}
              title="Details"
            >
              <TextAlignJustify aria-hidden="true" />
            </Link>
            <DownloadAuthGate className="card-download" canDownload={canDownload} downloadUrl={worksheet.pdfUrl}>
              <Download01 aria-hidden="true" />
              <span className="sr-only">{worksheet.documentType} herunterladen</span>
            </DownloadAuthGate>
            {worksheet.hasAnswerKey && (
              <DownloadAuthGate
                className="card-download"
                dataVariant="answer-key"
                canDownload={canDownload}
                downloadUrl={worksheet.answerKeyPdfUrl}
              >
                <ArrowDownToLine aria-hidden="true" />
                <span className="sr-only">Lösungsblatt herunterladen</span>
              </DownloadAuthGate>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
