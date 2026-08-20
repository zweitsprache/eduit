'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Worksheet } from '@/lib/worksheets';
import { useDazitViewer } from '@/lib/auth/use-dazit-viewer';

const TYPES = ['Arbeitsblatt', 'Merkblatt', 'Verbtabelle', 'Deklinationstabelle', 'Kommunikationskarten', 'Lernkarten', 'Wechselspiel', 'Domino', 'Dialog', 'Wörterliste', 'Leseverstehen'];
const LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];
const ACTIONS = ['Lesen', 'Hören', 'Monologisches Sprechen', 'Dialogisches Sprechen', 'Monologisches Schreiben', 'Dialogisches Schreiben'];
const LANGUAGES = ['Wortschatz', 'Grammatik', 'Aussprache', 'Intonation', 'Orthografie'];
const FIELDS = ['Deutschkurs', 'Gesundheit', 'Sicherheit und Notfälle', 'Familie und Partnerschaft', 'Kinder und Schule', 'Soziales Netz', 'Beratung und Unterstützung', 'Einkaufen', 'Ernährung', 'Wohnen', 'Mobilität', 'Finanzen und Versicherungen', 'Behörden', 'Freizeit und Hobbys', 'Kultur und Identität', 'Arbeit', 'Arbeitssuche', 'Umwelt und Klima', 'Technologie', 'Weiterbildung'];

export function InlineMetadataEditor({ worksheet }: { worksheet: Worksheet }) {
  const viewer = useDazitViewer();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: worksheet.title, excerpt: worksheet.description,
    searchSnippet: worksheet.searchSnippet || '',
    documentType: worksheet.documentType,
    level: worksheet.level || 'A1.1', tags: worksheet.tags.join(', '),
    actionCompetencies: worksheet.actionCompetencies || [],
    languageCompetencies: worksheet.languageCompetencies || [],
    grammarTags: (worksheet.grammarTags || []).join(', '),
    actionField: worksheet.actionField || '',
  });
  const toggle = (key: 'actionCompetencies' | 'languageCompetencies', value: string) => setForm((current) => ({
    ...current,
    [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
  }));
  const save = async () => {
    if (!worksheet.worksheetId) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/publications/${worksheet.worksheetId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          descriptionHtml: worksheet.descriptionHtml || '',
          actionCompetencyContributionHtml: worksheet.actionCompetencyContributionHtml || '',
          tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          grammarTags: form.grammarTags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || 'Metadaten konnten nicht gespeichert werden.');
      setEditing(false); router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Speichern fehlgeschlagen.');
    } finally { setSaving(false); }
  };
  if (!worksheet.worksheetId || !viewer?.isAdmin) return null;
  if (!editing) return <button className="metadata-edit-button" onClick={() => setEditing(true)} type="button">Metadaten bearbeiten</button>;
  return (
    <section className="inline-metadata-editor">
      <div className="metadata-editor-heading"><h2>Metadaten bearbeiten</h2><button onClick={() => setEditing(false)} type="button">Schliessen</button></div>
      <label>Titel<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label>Kartenauszug<textarea maxLength={280} rows={4} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></label>
      <label>SEO-Snippet<textarea maxLength={180} rows={3} value={form.searchSnippet} onChange={(event) => setForm({ ...form, searchSnippet: event.target.value })} /><small>Für Suchergebnisse. Leer lassen für Fallback auf Kartenauszug.</small></label>
      <div className="metadata-editor-row">
        <label>Dokumenttyp<select value={form.documentType} onChange={(event) => setForm({ ...form, documentType: event.target.value as Worksheet['documentType'] })}>{TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Niveau<select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>{LEVELS.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <label>Schlagwörter<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /><small>Mit Kommas trennen</small></label>
      <fieldset><legend>Sprachhandlungskompetenz</legend>{ACTIONS.map((value) => <label key={value}><input checked={form.actionCompetencies.includes(value)} onChange={() => toggle('actionCompetencies', value)} type="checkbox" /> {value}</label>)}</fieldset>
      <fieldset><legend>Sprachkompetenz</legend>{LANGUAGES.map((value) => <label key={value}><input checked={form.languageCompetencies.includes(value)} onChange={() => toggle('languageCompetencies', value)} type="checkbox" /> {value}</label>)}</fieldset>
      <label>Grammatik-Tags (IDs)<textarea maxLength={4000} rows={3} value={form.grammarTags} onChange={(event) => setForm({ ...form, grammarTags: event.target.value })} /><small>Mit Kommas trennen, z.B. verbgrammatik.tempus.perfekt</small></label>
      <label>Handlungsfeld<select value={form.actionField} onChange={(event) => setForm({ ...form, actionField: event.target.value })}><option value="">Nicht definiert</option>{FIELDS.map((value) => <option key={value}>{value}</option>)}</select></label>
      {error && <p className="metadata-editor-error">{error}</p>}
      <div className="metadata-editor-actions"><button onClick={() => setEditing(false)} type="button">Abbrechen</button><button disabled={saving} onClick={save} type="button">{saving ? 'Speichert …' : 'Speichern'}</button></div>
    </section>
  );
}
