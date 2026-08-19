'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Worksheet } from '@/lib/worksheets';
import { useDazitViewer } from '@/lib/auth/use-dazit-viewer';

export function InlineHtmlEditor({
  editable = false,
  field,
  heading,
  html,
  worksheet,
}: {
  editable?: boolean;
  field: 'descriptionHtml' | 'actionCompetencyContributionHtml';
  heading: string;
  html: string;
  worksheet: Worksheet;
}) {
  const viewer = useDazitViewer();
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const format = (command: string, value?: string) => {
    contentRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const cancel = () => {
    if (contentRef.current) contentRef.current.innerHTML = html;
    setError('');
    setEditing(false);
  };
  const save = async () => {
    if (!worksheet.worksheetId) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/publications/${worksheet.worksheetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: worksheet.title,
          excerpt: worksheet.description,
          documentType: worksheet.documentType,
          level: worksheet.level,
          tags: worksheet.tags,
          actionCompetencies: worksheet.actionCompetencies || [],
          languageCompetencies: worksheet.languageCompetencies || [],
          actionField: worksheet.actionField || '',
          descriptionHtml: field === 'descriptionHtml'
            ? contentRef.current?.innerHTML || ''
            : worksheet.descriptionHtml || '',
          actionCompetencyContributionHtml: field === 'actionCompetencyContributionHtml'
            ? contentRef.current?.innerHTML || ''
            : worksheet.actionCompetencyContributionHtml || '',
        }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || 'Inhalt konnte nicht gespeichert werden.');
      setEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const canEdit = editable && Boolean(viewer?.isAdmin);

  return (
    <article className={`publication-description inline-html-editor${editing ? ' is-editing' : ''}`}>
      <div className="inline-html-heading">
        <h2>{heading}</h2>
        {canEdit && !editing && <button onClick={() => setEditing(true)} type="button">Bearbeiten</button>}
      </div>
      {canEdit && editing && (
        <div className="inline-html-toolbar" aria-label="Textformatierung">
          <button onMouseDown={(event) => { event.preventDefault(); format('bold'); }} type="button"><strong>Fett</strong></button>
          <button onMouseDown={(event) => { event.preventDefault(); format('italic'); }} type="button"><em>Kursiv</em></button>
          <button onMouseDown={(event) => { event.preventDefault(); format('formatBlock', 'h2'); }} type="button">Zwischentitel</button>
          <button onMouseDown={(event) => { event.preventDefault(); format('insertUnorderedList'); }} type="button">Aufzählung</button>
          <button onMouseDown={(event) => { event.preventDefault(); format('formatBlock', 'p'); }} type="button">Absatz</button>
        </div>
      )}
      <div
        aria-label={`${heading} bearbeiten`}
        className="inline-html-content"
        contentEditable={canEdit && editing}
        dangerouslySetInnerHTML={{ __html: html }}
        ref={contentRef}
        suppressContentEditableWarning
      />
      {canEdit && editing && (
        <>
          {error && <p className="metadata-editor-error">{error}</p>}
          <div className="metadata-editor-actions">
            <button disabled={saving} onClick={cancel} type="button">Abbrechen</button>
            <button disabled={saving} onClick={save} type="button">{saving ? 'Speichert …' : 'Speichern'}</button>
          </div>
        </>
      )}
    </article>
  );
}
