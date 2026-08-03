'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { BrandProfile } from '@/lib/brand-profile-types';
import { AppShell } from '@/components/app/app-shell';

type Config = { id: string; tense: string; mood: string; label: string; level: string; enabled: boolean };
type CreatedWorksheet = { id: string; title: string };
type CreationFailure = { key: string; label: string; error: string };
type FinalizeJob = {
  id: string;
  title: string;
  attempt: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
};
type FinalizingState = { jobs: FinalizeJob[]; publish: boolean };
type MetadataPublication = {
  id: string;
  title: string;
  level: string | null;
  metadataVersion: number;
  updatedAt: string;
};
type UnpublishedLearningCard = {
  id: string;
  title: string;
  hasPreview: boolean;
  createdAt: string;
};

const FINALIZATION_CONCURRENCY = 2;
const MAX_ATTEMPTS = 3;
const JSON_IMPORT_EXAMPLE = JSON.stringify({
  schemaVersion: 1,
  worksheet: {
    title: 'Basiswortschatz | Einkaufen',
    documentSize: 'a4-portrait',
    showSolutions: false,
    status: 'draft',
    context: {
      worksheetLanguage: 'de-formal',
      subject: 'Deutsch',
      contentLanguage: 'German',
      country: 'Schweiz',
    },
    blocks: [
      { type: 'heading', text: 'Basiswortschatz | Einkaufen', level: 1, numbered: false, gapAfter: 2 },
      { type: 'heading', text: 'Verben', level: 2, numbered: false, gapAfter: 1 },
      {
        type: 'glossary', preset: 'verbs', showInstruction: false,
        entries: [{ term: 'kaufen', definition: 'habe gekauft', example: 'Ich kaufe eine Jacke.' }],
      },
    ],
  },
}, null, 2);

const INITIAL: Config[] = [
  { id: 'present', tense: 'present', mood: 'indicative', label: 'Indikativ Präsens', level: 'A1.1', enabled: true },
  { id: 'perfect', tense: 'perfect', mood: 'indicative', label: 'Indikativ Perfekt', level: 'A1.2', enabled: true },
  { id: 'preterite', tense: 'preterite', mood: 'indicative', label: 'Indikativ Präteritum', level: 'B1.1', enabled: true },
  { id: 'pluperfect', tense: 'pluperfect', mood: 'indicative', label: 'Indikativ Plusquamperfekt', level: 'B1.1', enabled: true },
  { id: 'future-one', tense: 'future-one', mood: 'indicative', label: 'Indikativ Futur I', level: 'B1.1', enabled: true },
  { id: 'subjunctive-two-past', tense: 'perfect', mood: 'subjunctive-two', label: 'Konjunktiv II Vergangenheit', level: 'B1.1', enabled: true },
];

function publicationTense(title: string) {
  if (/Konjunktiv II Vergangenheit/i.test(title)) return 'Konjunktiv II Vergangenheit';
  if (/Plusquamperfekt/i.test(title)) return 'Plusquamperfekt';
  if (/Präteritum/i.test(title)) return 'Präteritum';
  if (/Perfekt/i.test(title)) return 'Perfekt';
  if (/Futur I/i.test(title)) return 'Futur I';
  if (/Präsens/i.test(title)) return 'Präsens';
  return 'Sonstige';
}

export default function AutomationsPage() {
  const [verbs, setVerbs] = useState('');
  const [configs, setConfigs] = useState(INITIAL);
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [brandProfileId, setBrandProfileId] = useState('');
  const [publish, setPublish] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<CreatedWorksheet[]>([]);
  const [creationFailures, setCreationFailures] = useState<CreationFailure[]>([]);
  const [generationBatchId, setGenerationBatchId] = useState('');
  const [finalizing, setFinalizing] = useState<FinalizingState | null>(null);
  const [finalizationSource, setFinalizationSource] = useState<'verb' | 'backlog' | null>(null);
  const [metadataPublications, setMetadataPublications] = useState<MetadataPublication[]>([]);
  const [metadataTense, setMetadataTense] = useState('all');
  const [metadataBatchSize, setMetadataBatchSize] = useState(10);
  const [metadataFinalizing, setMetadataFinalizing] = useState<FinalizingState | null>(null);
  const [metadataRunning, setMetadataRunning] = useState(false);
  const [metadataProgress, setMetadataProgress] = useState('');
  const [metadataError, setMetadataError] = useState('');
  const [metadataQueuedIds, setMetadataQueuedIds] = useState<string[]>([]);
  const [unpublishedLearningCards, setUnpublishedLearningCards] = useState<UnpublishedLearningCard[]>([]);
  const [unpublishedBatchSize, setUnpublishedBatchSize] = useState(25);
  const [unpublishedError, setUnpublishedError] = useState('');
  const [worksheetJson, setWorksheetJson] = useState('');
  const [jsonImportRunning, setJsonImportRunning] = useState(false);
  const [jsonImportError, setJsonImportError] = useState('');
  const [jsonImportResults, setJsonImportResults] = useState<CreatedWorksheet[]>([]);
  const resultsRef = useRef<CreatedWorksheet[]>([]);
  const isVerbRunning = running && finalizationSource === 'verb';
  const isBacklogRunning = running && finalizationSource === 'backlog';

  useEffect(() => {
    const storedBatchId = sessionStorage.getItem('eduit-verb-series-batch');
    if (!storedBatchId) return;
    setGenerationBatchId(storedBatchId);
    setRunning(true);
  }, []);

  useEffect(() => {
    if (!generationBatchId || !running) return;
    const poll = async () => {
      try {
        const response = await fetch(`/api/automations/verb-series?batchId=${encodeURIComponent(generationBatchId)}`, { cache: 'no-store' });
        const result = await response.json().catch(() => ({})) as {
          error?: string;
          batch?: { publish: boolean; totalJobs: number };
          jobs?: Array<{ id: string; status: string; worksheetId?: string; title?: string; infinitive: string; label: string; error?: string }>;
        };
        if (!response.ok || !result.batch || !result.jobs) throw new Error(result.error || 'Batchstatus konnte nicht geladen werden.');
        const completed = result.jobs.filter(({ status }) => status === 'completed');
        const failed = result.jobs.filter(({ status }) => status === 'failed');
        setProgress(`${completed.length}/${result.batch.totalJobs} Generierungsaufträge abgeschlossen${failed.length ? `, ${failed.length} fehlgeschlagen` : ''}.`);
        if (completed.length + failed.length !== result.batch.totalJobs) return;
        const created = completed.flatMap(({ worksheetId, title }) => worksheetId && title ? [{ id: worksheetId, title }] : []);
        const failures = failed.map((job) => ({ key: job.id, label: `${job.infinitive} · ${job.label}`, error: job.error || 'Automation fehlgeschlagen.' }));
        resultsRef.current = created;
        setResults(created);
        setCreationFailures(failures);
        setGenerationBatchId('');
        sessionStorage.removeItem('eduit-verb-series-batch');
        if (!created.length) {
          setError('Es konnten keine Arbeitsblätter erstellt werden.');
          setRunning(false);
          return;
        }
        setProgress(`0/${created.length}: Vorschau${result.batch.publish ? ' und Veröffentlichung' : ''} mit ${FINALIZATION_CONCURRENCY} parallelen Renderern …`);
        setFinalizing({
          publish: result.batch.publish,
          jobs: created.map(({ id, title }) => ({ id, title, attempt: 1, status: 'pending' })),
        });
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : 'Batchstatus konnte nicht geladen werden.');
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 2_000);
    return () => window.clearInterval(timer);
  }, [generationBatchId, running]);

  useEffect(() => {
    void fetch('/api/admin/brand-profiles', { cache: 'no-store' }).then((response) => response.json()).then((result) => {
      const active = (result.profiles || []).filter((profile: BrandProfile) => profile.isActive);
      setProfiles(active);
      setBrandProfileId(active.find((profile: BrandProfile) => profile.name === 'dazit')?.id || active.find((profile: BrandProfile) => profile.isDefault)?.id || '');
    });
  }, []);

  useEffect(() => {
    if (isBacklogRunning) return;
    void fetch('/api/automations/unpublished-learning-cards', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String(result.error || 'Unveröffentlichte Lernkarten konnten nicht geladen werden.'));
        setUnpublishedLearningCards(Array.isArray(result.worksheets) ? result.worksheets : []);
        setUnpublishedError('');
      })
      .catch((loadError) => setUnpublishedError(
        loadError instanceof Error ? loadError.message : 'Unveröffentlichte Lernkarten konnten nicht geladen werden.',
      ));
  }, [isBacklogRunning]);

  useEffect(() => {
    if (!metadataRunning || !metadataQueuedIds.length) return;
    const poll = async () => {
      const response = await fetch('/api/dazit/metadata-republish', { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(result.publications)) return;
      const publications = result.publications as MetadataPublication[];
      setMetadataPublications(publications);
      const remainingIds = new Set(publications.map(({ id }) => id));
      const remaining = metadataQueuedIds.filter((id) => remainingIds.has(id)).length;
      const completed = metadataQueuedIds.length - remaining;
      setMetadataProgress(`${completed}/${metadataQueuedIds.length} Metadaten neu veröffentlicht${remaining ? ' …' : '.'}`);
      if (!remaining) {
        setMetadataRunning(false);
        setMetadataQueuedIds([]);
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 5_000);
    return () => window.clearInterval(timer);
  }, [metadataQueuedIds, metadataRunning]);

  useEffect(() => {
    void fetch('/api/dazit/metadata-republish', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => {
        if (Array.isArray(result.publications)) setMetadataPublications(result.publications);
        else if (result.error) setMetadataError(String(result.error));
      })
      .catch((loadError) => setMetadataError(
        loadError instanceof Error ? loadError.message : 'Metadaten-Warteschlange konnte nicht geladen werden.',
      ));
  }, []);

  useEffect(() => {
    if (!finalizing || !running) return;
    const runningCount = finalizing.jobs.filter(({ status }) => status === 'running').length;
    const capacity = FINALIZATION_CONCURRENCY - runningCount;
    if (capacity <= 0) return;
    const nextIds = finalizing.jobs
      .filter(({ status }) => status === 'pending')
      .slice(0, capacity)
      .map(({ id }) => id);
    if (!nextIds.length) return;
    setFinalizing((current) => current ? {
      ...current,
      jobs: current.jobs.map((job) => nextIds.includes(job.id) ? { ...job, status: 'running' } : job),
    } : null);
  }, [finalizing, running]);

  useEffect(() => {
    if (!metadataFinalizing || !metadataRunning) return;
    const runningCount = metadataFinalizing.jobs.filter(({ status }) => status === 'running').length;
    if (runningCount >= FINALIZATION_CONCURRENCY) return;
    const nextId = metadataFinalizing.jobs.find(({ status }) => status === 'pending')?.id;
    if (!nextId) return;
    setMetadataFinalizing((current) => current ? {
      ...current,
      jobs: current.jobs.map((job) => job.id === nextId
        ? { ...job, status: 'running' }
        : job),
    } : null);
  }, [metadataFinalizing, metadataRunning]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'eduit-automation-item-complete') return;
      setFinalizing((current) => {
        if (!current) return current;
        const matched = current.jobs.find(({ id, status }) => id === event.data.worksheetId && status === 'running');
        if (!matched) return current;
        const retry = !event.data.success && matched.attempt < MAX_ATTEMPTS;
        const jobs = current.jobs.map((job) => job.id === matched.id ? {
          ...job,
          attempt: retry ? job.attempt + 1 : job.attempt,
          status: event.data.success ? 'completed' as const : retry ? 'pending' as const : 'failed' as const,
          error: event.data.success ? undefined : event.data.error || 'Vorschau oder Veröffentlichung fehlgeschlagen.',
        } : job);
        const finished = jobs.every(({ status }) => status === 'completed' || status === 'failed');
        if (finished) {
          const completed = jobs.filter(({ status }) => status === 'completed').length;
          const failed = jobs.filter(({ status }) => status === 'failed').length;
          setProgress(`${completed}/${jobs.length} Arbeitsblätter vollständig verarbeitet${failed ? `, ${failed} fehlgeschlagen` : ''}.`);
          setRunning(false);
        }
        return { ...current, jobs };
      });
      setMetadataFinalizing((current) => {
        if (!current) return current;
        const matched = current.jobs.find(({ id, status }) => (
          id === event.data.worksheetId && status === 'running'
        ));
        if (!matched) return current;
        const retry = !event.data.success && matched.attempt < MAX_ATTEMPTS;
        const jobs = current.jobs.map((job) => job.id === matched.id ? {
          ...job,
          attempt: retry ? job.attempt + 1 : job.attempt,
          status: event.data.success
            ? 'completed' as const
            : retry
              ? 'pending' as const
              : 'failed' as const,
          error: event.data.success
            ? undefined
            : event.data.error || 'Metadaten-Neuveröffentlichung fehlgeschlagen.',
        } : job);
        if (event.data.success) {
          setMetadataPublications((publications) => publications.filter(
            ({ id }) => id !== matched.id,
          ));
        }
        const completed = jobs.filter(({ status }) => status === 'completed').length;
        const failed = jobs.filter(({ status }) => status === 'failed').length;
        setMetadataProgress(`${completed}/${jobs.length} Metadaten neu veröffentlicht${failed ? `, ${failed} fehlgeschlagen` : ''}.`);
        if (jobs.every(({ status }) => status === 'completed' || status === 'failed')) {
          setMetadataRunning(false);
        }
        return { ...current, jobs };
      });
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

  const total = useMemo(() => verbs.split(/[\n,;]/).filter((value) => value.trim()).length * configs.filter(({ enabled }) => enabled).length, [configs, verbs]);
  const updateConfig = (id: string, patch: Partial<Config>) => setConfigs((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));

  const run = async () => {
    const infinitives = [...new Set(verbs.split(/[\n,;]/).map((value) => value.trim()).filter(Boolean))];
    const selected = configs.filter(({ enabled }) => enabled);
    if (!infinitives.length || !selected.length || !brandProfileId) return;
    resultsRef.current = [];
    setRunning(true);
    setError('');
    setResults([]);
    setCreationFailures([]);
    setFinalizing(null);
    setFinalizationSource('verb');

    setProgress(`${infinitives.length * selected.length} Generierungsaufträge werden in die Workflow-Warteschlange gestellt …`);
    try {
      const response = await fetch('/api/automations/verb-series', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ infinitives, configs: selected, brandProfileId, publish }),
      });
      const result = await response.json().catch(() => ({})) as { batchId?: string; error?: string };
      if (!response.ok || !result.batchId) throw new Error(result.error || 'Workflow konnte nicht gestartet werden.');
      setGenerationBatchId(result.batchId);
      sessionStorage.setItem('eduit-verb-series-batch', result.batchId);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Workflow konnte nicht gestartet werden.');
      setRunning(false);
    }
  };

  const retryFinalizationFailures = () => {
    setError('');
    setRunning(true);
    setFinalizing((current) => current ? {
      ...current,
      jobs: current.jobs.map((job) => job.status === 'failed' ? { ...job, status: 'pending', attempt: 1, error: undefined } : job),
    } : null);
  };

  const startUnpublishedLearningCards = () => {
    const selected = unpublishedLearningCards.slice(0, unpublishedBatchSize);
    if (!selected.length) return;
    setError('');
    setUnpublishedError('');
    setResults(selected.map(({ id, title }) => ({ id, title })));
    setCreationFailures([]);
    setFinalizationSource('backlog');
    setProgress(`0/${selected.length}: Vorschau und Veröffentlichung mit ${FINALIZATION_CONCURRENCY} parallelen Renderern …`);
    setFinalizing({
      publish: true,
      jobs: selected.map(({ id, title }) => ({ id, title, attempt: 1, status: 'pending' })),
    });
    setRunning(true);
  };

  const startMetadataRepublish = async () => {
    const eligible = metadataPublications
      .filter(({ title }) => metadataTense === 'all' || publicationTense(title) === metadataTense)
      .slice(0, metadataBatchSize);
    if (!eligible.length) return;
    setMetadataError('');
    setMetadataProgress(`${eligible.length} Metadaten werden in die Warteschlange gestellt …`);
    try {
      const response = await fetch('/api/dazit/metadata-republish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worksheetIds: eligible.map(({ id }) => id) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(result.error || 'Workflow konnte nicht gestartet werden.'));
      setMetadataQueuedIds(eligible.map(({ id }) => id));
      setMetadataProgress(`0/${eligible.length} Metadaten neu veröffentlicht …`);
      setMetadataRunning(true);
    } catch (startError) {
      setMetadataError(startError instanceof Error ? startError.message : 'Workflow konnte nicht gestartet werden.');
      setMetadataProgress('');
    }
  };

  const retryMetadataFailures = () => {
    setMetadataError('');
    setMetadataRunning(true);
    setMetadataFinalizing((current) => current ? {
      ...current,
      jobs: current.jobs.map((job) => job.status === 'failed'
        ? { ...job, status: 'pending', attempt: 1, error: undefined }
        : job),
    } : null);
  };

  const importWorksheetJson = async () => {
    setJsonImportError('');
    setJsonImportResults([]);
    setJsonImportRunning(true);
    try {
      const data = JSON.parse(worksheetJson) as unknown;
      const response = await fetch('/api/automations/worksheet-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, brandProfileId: brandProfileId || null }),
      });
      const result = await response.json().catch(() => ({})) as {
        worksheets?: CreatedWorksheet[];
        error?: string;
      };
      if (!response.ok || !result.worksheets) {
        throw new Error(result.error || 'JSON-Import fehlgeschlagen.');
      }
      setJsonImportResults(result.worksheets);
      setWorksheetJson('');
    } catch (importError) {
      setJsonImportError(importError instanceof Error
        ? importError.message
        : 'JSON-Import fehlgeschlagen.');
    } finally {
      setJsonImportRunning(false);
    }
  };

  const finalizationCompleted = finalizing?.jobs.filter(({ status }) => status === 'completed').length ?? 0;
  const finalizationFailed = finalizing?.jobs.filter(({ status }) => status === 'failed').length ?? 0;
  const activeFinalizers = finalizing?.jobs.filter(({ status }) => status === 'running') ?? [];
  const metadataActiveFinalizers = metadataFinalizing?.jobs.filter(({ status }) => status === 'running') ?? [];
  const metadataFailed = metadataFinalizing?.jobs.filter(({ status }) => status === 'failed') ?? [];
  const metadataTenses = [...new Set(metadataPublications.map(({ title }) => publicationTense(title)))].sort();
  const eligibleMetadataCount = metadataPublications.filter(({ title }) => (
    metadataTense === 'all' || publicationTense(title) === metadataTense
  )).length;

  return (
    <AppShell active="automations" title="Automationen">
      <div className="min-h-full bg-secondary px-6 py-10 text-primary">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between"><div><p className="text-sm font-semibold text-brand-secondary">Eduit Automations</p><h1 className="mt-1 text-display-sm font-semibold">Automationen</h1><p className="mt-2 text-tertiary">Wiederkehrende Produktionsabläufe gesammelt ausführen.</p></div><Link className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold" href="/documents">Dokumente</Link></div>
          <section className="rounded-2xl border border-secondary bg-primary p-7 shadow-lg">
            <h2 className="text-xl font-semibold">Verb-Lernkartenserie</h2><p className="mt-1 text-sm text-tertiary">Erstellt pro Verb eine konfigurierbare Serie mit acht Personalformen und leerer neunter Karte.</p>
            <label className="mt-6 block text-sm font-semibold">Infinitive<textarea className="mt-2 min-h-28 w-full rounded-lg border border-primary bg-primary p-3 font-normal" onChange={(event) => setVerbs(event.target.value)} placeholder={'sein\nhaben\nwerden'} value={verbs} /></label>
            <div className="mt-6 overflow-hidden rounded-xl border border-secondary">{configs.map((config) => <div className="grid grid-cols-[auto_1fr_8rem] items-center gap-4 border-b border-secondary p-4 last:border-0" key={config.id}><input checked={config.enabled} onChange={(event) => updateConfig(config.id, { enabled: event.target.checked })} type="checkbox" /><span className="text-sm font-semibold">{config.label}</span><select className="rounded-md border border-primary bg-primary px-2 py-1.5 text-sm" onChange={(event) => updateConfig(config.id, { level: event.target.value })} value={config.level}>{['A1.1','A1.2','A2.1','A2.2','B1.1','B1.2'].map((level) => <option key={level}>{level}</option>)}</select></div>)}</div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Marke<select className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2" onChange={(event) => setBrandProfileId(event.target.value)} value={brandProfileId}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label><label className="flex items-end gap-2 pb-2 text-sm font-semibold"><input checked={publish} onChange={(event) => setPublish(event.target.checked)} type="checkbox" /> Nach Erstellung auf Dazit veröffentlichen</label></div>
            {finalizationSource !== 'backlog' && progress && <p className="mt-5 text-sm text-tertiary">{progress}</p>}
            {finalizationSource !== 'backlog' && finalizing && <p className="mt-2 text-sm text-tertiary">Finalisierung: {finalizationCompleted}/{finalizing.jobs.length} abgeschlossen{finalizationFailed ? `, ${finalizationFailed} fehlgeschlagen` : ''}</p>}
            {finalizationSource !== 'backlog' && error && <p className="mt-3 text-sm text-error-primary">{error}</p>}
            {creationFailures.length > 0 && <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">{creationFailures.length} fehlgeschlagene Generierungsaufträge</summary><ul className="mt-2 grid gap-1 text-error-primary">{creationFailures.map((failure) => <li key={failure.key}>{failure.label}: {failure.error}</li>)}</ul></details>}
            {finalizationSource !== 'backlog' && finalizationFailed > 0 && !running && <button className="mt-4 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold" onClick={retryFinalizationFailures} type="button">Fehlgeschlagene Finalisierungen erneut versuchen</button>}
            {finalizationSource !== 'backlog' && finalizationFailed > 0 && (
              <details className="mt-4 text-sm" open={!running}>
                <summary className="cursor-pointer font-semibold">
                  {finalizationFailed} fehlgeschlagene Finalisierungen
                </summary>
                <ul className="mt-2 grid gap-1 text-error-primary">
                  {finalizing?.jobs
                    .filter(({ status }) => status === 'failed')
                    .map((job) => (
                      <li key={job.id}>{job.title}: {job.error || 'Unbekannter Fehler.'}</li>
                    ))}
                </ul>
              </details>
            )}
            <button className="mt-6 rounded-lg bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={running || metadataRunning || !total} onClick={() => void run()} type="button">{isVerbRunning ? 'Serie wird verarbeitet …' : `${total || 0} Arbeitsblätter erstellen`}</button>
            {finalizationSource !== 'backlog' && results.length > 0 && <div className="mt-7"><h3 className="font-semibold">Ergebnisse</h3><ul className="mt-2 grid gap-2">{results.map((result) => <li key={result.id}><Link className="text-sm text-brand-secondary underline" href={`/editor?worksheet=${result.id}`}>{result.title}</Link></li>)}</ul></div>}
            {running && finalizing && activeFinalizers.map((job) => (
              <iframe
                aria-hidden="true"
                className="pointer-events-none fixed -left-[10000px] top-0 h-[900px] w-[1200px] opacity-0"
                key={`${job.id}-${job.attempt}`}
                src={`/editor?worksheet=${encodeURIComponent(job.id)}&automation=${finalizing.publish ? 'batch-publish' : 'batch-preview'}`}
                title={`Automatischer Arbeitsblatt-Renderer: ${job.title}`}
              />
            ))}
          </section>
          <section className="mt-8 rounded-2xl border border-secondary bg-primary p-7 shadow-lg">
            <p className="text-sm font-semibold text-brand-secondary">AI-Import</p>
            <h2 className="mt-1 text-xl font-semibold">Arbeitsblätter aus JSON erstellen</h2>
            <p className="mt-2 text-sm text-tertiary">
              Importiert ein einzelnes <code>worksheet</code> oder bis zu 100 Einträge in <code>worksheets</code>. Überschriften und Glossare werden validiert und in Editor-Blöcke umgewandelt.
            </p>
            <label className="mt-6 block text-sm font-semibold">
              Worksheet JSON
              <textarea
                className="mt-2 min-h-80 w-full rounded-lg border border-primary bg-primary p-3 font-mono text-xs font-normal leading-5"
                onChange={(event) => setWorksheetJson(event.target.value)}
                placeholder={JSON_IMPORT_EXAMPLE}
                spellCheck={false}
                value={worksheetJson}
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold"
                disabled={jsonImportRunning}
                onClick={() => setWorksheetJson(JSON_IMPORT_EXAMPLE)}
                type="button"
              >
                Beispiel einsetzen
              </button>
              <button
                className="rounded-lg bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                disabled={jsonImportRunning || !worksheetJson.trim() || !brandProfileId}
                onClick={() => void importWorksheetJson()}
                type="button"
              >
                {jsonImportRunning ? 'JSON wird importiert …' : 'Arbeitsblätter erstellen'}
              </button>
            </div>
            {jsonImportError && <p className="mt-4 text-sm text-error-primary">{jsonImportError}</p>}
            {jsonImportResults.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold">{jsonImportResults.length} Arbeitsblätter erstellt</h3>
                <ul className="mt-2 grid gap-2">
                  {jsonImportResults.map((result) => (
                    <li key={result.id}>
                      <Link className="text-sm text-brand-secondary underline" href={`/editor?worksheet=${result.id}`}>
                        {result.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <section className="mt-8 rounded-2xl border border-secondary bg-primary p-7 shadow-lg">
            <p className="text-sm font-semibold text-brand-secondary">Dazit-Veröffentlichung</p>
            <h2 className="mt-1 text-xl font-semibold">Unveröffentlichte Lernkarten fertigstellen</h2>
            <p className="mt-2 text-sm text-tertiary">
              Findet automatisch erzeugte Dazit-Lernkarten ohne Veröffentlichung, erstellt die Vorschau und veröffentlicht sie inklusive PDF, Seitenbildern und Metadaten.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <label className="text-sm font-semibold">
                Batchgrösse
                <select
                  className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 font-normal"
                  disabled={running}
                  onChange={(event) => setUnpublishedBatchSize(Number(event.target.value))}
                  value={unpublishedBatchSize}
                >
                  {[5, 10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <div className="rounded-xl border border-secondary bg-secondary p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-tertiary">Unveröffentlicht</span>
                <strong className="mt-1 block text-2xl">{unpublishedLearningCards.length}</strong>
                <small className="text-tertiary">{unpublishedLearningCards.filter(({ hasPreview }) => !hasPreview).length} ohne Vorschau</small>
              </div>
              <div className="flex items-end">
                <button
                  className="w-full rounded-lg bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={running || unpublishedLearningCards.length === 0}
                  onClick={startUnpublishedLearningCards}
                  type="button"
                >
                  {isBacklogRunning
                    ? 'Lernkarten werden veröffentlicht …'
                    : `${Math.min(unpublishedBatchSize, unpublishedLearningCards.length)} Lernkarten veröffentlichen`}
                </button>
              </div>
            </div>
            {finalizationSource === 'backlog' && progress && <p className="mt-5 text-sm text-tertiary">{progress}</p>}
            {finalizationSource === 'backlog' && finalizing && <p className="mt-2 text-sm text-tertiary">Finalisierung: {finalizationCompleted}/{finalizing.jobs.length} abgeschlossen{finalizationFailed ? `, ${finalizationFailed} fehlgeschlagen` : ''}</p>}
            {finalizationSource === 'backlog' && error && <p className="mt-3 text-sm text-error-primary">{error}</p>}
            {finalizationSource === 'backlog' && finalizationFailed > 0 && !running && (
              <button className="mt-4 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold" onClick={retryFinalizationFailures} type="button">
                Fehlgeschlagene Finalisierungen erneut versuchen
              </button>
            )}
            {finalizationSource === 'backlog' && finalizationFailed > 0 && (
              <details className="mt-4 text-sm" open={!running}>
                <summary className="cursor-pointer font-semibold">{finalizationFailed} fehlgeschlagene Veröffentlichungen</summary>
                <ul className="mt-2 grid gap-1 text-error-primary">
                  {finalizing?.jobs.filter(({ status }) => status === 'failed').map((job) => (
                    <li key={job.id}>{job.title}: {job.error || 'Unbekannter Fehler.'}</li>
                  ))}
                </ul>
              </details>
            )}
            {finalizationSource === 'backlog' && results.length > 0 && (
              <details className="mt-5 text-sm">
                <summary className="cursor-pointer font-semibold">{results.length} ausgewählte Lernkarten</summary>
                <ul className="mt-2 grid gap-2">
                  {results.map((result) => <li key={result.id}><Link className="text-brand-secondary underline" href={`/editor?worksheet=${result.id}`}>{result.title}</Link></li>)}
                </ul>
              </details>
            )}
            {unpublishedError && <p className="mt-3 text-sm text-error-primary">{unpublishedError}</p>}
          </section>
          <section className="mt-8 rounded-2xl border border-secondary bg-primary p-7 shadow-lg">
            <p className="text-sm font-semibold text-brand-secondary">Dazit-Metadaten</p>
            <h2 className="mt-1 text-xl font-semibold">Lernkarten-Beschreibungen neu veröffentlichen</h2>
            <p className="mt-2 text-sm text-tertiary">
              Verarbeitet bestehende Lernkarten mit einer älteren Metadatenversion. Die Beschreibung wird anhand des bereits veröffentlichten PDFs mit den aktuellen Regeln für Vorder- und Rückseiten neu erzeugt. PDF und Vorschaubilder bleiben unverändert.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <label className="text-sm font-semibold">
                Zeitform
                <select
                  className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 font-normal"
                  disabled={metadataRunning}
                  onChange={(event) => setMetadataTense(event.target.value)}
                  value={metadataTense}
                >
                  <option value="all">Alle Zeitformen</option>
                  {metadataTenses.map((tense) => <option key={tense} value={tense}>{tense}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Batchgrösse
                <select
                  className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 font-normal"
                  disabled={metadataRunning}
                  onChange={(event) => setMetadataBatchSize(Number(event.target.value))}
                  value={metadataBatchSize}
                >
                  {[2, 5, 10, 15, 25].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <div className="rounded-xl border border-secondary bg-secondary p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-tertiary">Verbleibend</span>
                <strong className="mt-1 block text-2xl">{eligibleMetadataCount}</strong>
                <small className="text-tertiary">{metadataPublications.length} insgesamt veraltet</small>
              </div>
            </div>
            {metadataProgress && <p className="mt-5 text-sm text-tertiary">{metadataProgress}</p>}
            {metadataError && <p className="mt-3 text-sm text-error-primary">{metadataError}</p>}
            {metadataFailed.length > 0 && (
              <details className="mt-4 text-sm" open={!metadataRunning}>
                <summary className="cursor-pointer font-semibold">{metadataFailed.length} fehlgeschlagene Neuveröffentlichungen</summary>
                <ul className="mt-2 grid gap-1 text-error-primary">
                  {metadataFailed.map((job) => <li key={job.id}>{job.title}: {job.error || 'Unbekannter Fehler.'}</li>)}
                </ul>
              </details>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                disabled={running || metadataRunning || eligibleMetadataCount === 0}
                onClick={() => void startMetadataRepublish()}
                type="button"
              >
                {metadataRunning
                  ? 'Metadaten werden neu veröffentlicht …'
                  : `Nächste ${Math.min(metadataBatchSize, eligibleMetadataCount)} neu veröffentlichen`}
              </button>
              {metadataFailed.length > 0 && !metadataRunning && (
                <button className="rounded-lg border border-primary bg-primary px-4 py-2.5 text-sm font-semibold" onClick={retryMetadataFailures} type="button">
                  Fehlgeschlagene erneut versuchen
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
