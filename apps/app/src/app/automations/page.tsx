'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { BrandProfile } from '@/lib/brand-profile-types';
import { AppShell } from '@/components/app/app-shell';
import {
  buildGeneratedVerbLearningCards,
  type Mood,
  type Tense,
} from '@/components/editor/learning-cards-ai-modal';

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

const CREATION_CONCURRENCY = 5;
const FINALIZATION_CONCURRENCY = 1;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_000;

const INITIAL: Config[] = [
  { id: 'present', tense: 'present', mood: 'indicative', label: 'Indikativ Präsens', level: 'A1.1', enabled: true },
  { id: 'perfect', tense: 'perfect', mood: 'indicative', label: 'Indikativ Perfekt', level: 'A1.2', enabled: true },
  { id: 'preterite', tense: 'preterite', mood: 'indicative', label: 'Indikativ Präteritum', level: 'B1.1', enabled: true },
  { id: 'pluperfect', tense: 'pluperfect', mood: 'indicative', label: 'Indikativ Plusquamperfekt', level: 'B1.1', enabled: true },
  { id: 'future-one', tense: 'future-one', mood: 'indicative', label: 'Indikativ Futur I', level: 'B1.1', enabled: true },
  { id: 'subjunctive-two-past', tense: 'perfect', mood: 'subjunctive-two', label: 'Konjunktiv II Vergangenheit', level: 'B1.1', enabled: true },
];

const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function worksheetHtml(title: string, items: unknown[]) {
  const attrs = `data-title="${escape(title)}" data-format="a8-landscape" data-sidedness="double" data-items="${escape(encodeURIComponent(JSON.stringify(items)))}" data-group-index="0" data-type="learning-cards"`;
  return `<div ${attrs} data-sheet-side="front"></div><div ${attrs} data-sheet-side="back"></div>`;
}

async function responseJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<Record<string, unknown>>;
}

async function withRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await wait(RETRY_BASE_DELAY_MS * (2 ** (attempt - 1)));
    }
  }
  throw lastError;
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
  const [finalizing, setFinalizing] = useState<FinalizingState | null>(null);
  const resultsRef = useRef<CreatedWorksheet[]>([]);

  useEffect(() => {
    void fetch('/api/admin/brand-profiles', { cache: 'no-store' }).then((response) => response.json()).then((result) => {
      const active = (result.profiles || []).filter((profile: BrandProfile) => profile.isActive);
      setProfiles(active);
      setBrandProfileId(active.find((profile: BrandProfile) => profile.name === 'dazit')?.id || active.find((profile: BrandProfile) => profile.isDefault)?.id || '');
    });
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
    const jobs = infinitives.flatMap((infinitive) => selected.map((config) => ({
      key: `${infinitive.toLocaleLowerCase('de-DE')}::${config.id}`,
      infinitive,
      config,
    })));
    let nextIndex = 0;
    let completed = 0;
    const failures: CreationFailure[] = [];
    resultsRef.current = [];
    setRunning(true);
    setError('');
    setResults([]);
    setCreationFailures([]);
    setFinalizing(null);

    const createJob = async (job: typeof jobs[number]) => withRetry(async () => {
      const generationResponse = await fetch('/api/ai/german-verb-table', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ infinitive: job.infinitive, tense: job.config.tense, mood: job.config.mood }),
      });
      const generation = await responseJson(generationResponse);
      if (!generationResponse.ok || !generation.forms) throw new Error(String(generation.error || `Verbformen für ${job.infinitive} fehlen.`));
      const generatedCards = buildGeneratedVerbLearningCards(
        generation as Parameters<typeof buildGeneratedVerbLearningCards>[0],
        job.config.tense as Tense,
        job.config.mood as Exclude<Mood, 'imperative'>,
        job.config.id === 'subjunctive-two-past' ? 'Vergangenheit' : undefined,
      );
      const response = await fetch('/api/worksheets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedCards.title,
          contentHtml: worksheetHtml(generatedCards.title, generatedCards.items),
          documentSize: 'a4-portrait', showSolutions: false, status: 'draft', brandProfileId,
          context: { worksheetLanguage: 'de-formal', subject: 'Deutsch', learnerStage: 'adult-education', contentLanguage: 'German', languageLevel: job.config.level },
        }),
      });
      const result = await responseJson(response);
      if (!response.ok || !result.worksheet) throw new Error(String(result.error || `«${generatedCards.title}» konnte nicht erstellt werden.`));
      const worksheet = result.worksheet as { id: string };
      return { id: worksheet.id, title: generatedCards.title };
    });

    const worker = async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        const job = jobs[index];
        if (!job) return;
        setProgress(`${completed}/${jobs.length} erstellt · ${Math.min(CREATION_CONCURRENCY, jobs.length - completed)} parallel aktiv`);
        try {
          const created = await createJob(job);
          resultsRef.current = [...resultsRef.current, created];
          setResults([...resultsRef.current]);
        } catch (runError) {
          failures.push({
            key: job.key,
            label: `${job.infinitive} · ${job.config.label}`,
            error: runError instanceof Error ? runError.message : 'Automation fehlgeschlagen.',
          });
          setCreationFailures([...failures]);
        } finally {
          completed += 1;
          setProgress(`${completed}/${jobs.length} Generierungsaufträge abgeschlossen${failures.length ? `, ${failures.length} fehlgeschlagen` : ''}.`);
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(CREATION_CONCURRENCY, jobs.length) }, () => worker()));
    const created = resultsRef.current;
    if (!created.length) {
      setError('Es konnten keine Arbeitsblätter erstellt werden.');
      setRunning(false);
      return;
    }
    setProgress(`0/${created.length}: Vorschau${publish ? ' und Veröffentlichung' : ''} mit ${FINALIZATION_CONCURRENCY} parallelen Renderern …`);
    setFinalizing({
      publish,
      jobs: created.map(({ id, title }) => ({ id, title, attempt: 1, status: 'pending' })),
    });
  };

  const retryFinalizationFailures = () => {
    setError('');
    setRunning(true);
    setFinalizing((current) => current ? {
      ...current,
      jobs: current.jobs.map((job) => job.status === 'failed' ? { ...job, status: 'pending', attempt: 1, error: undefined } : job),
    } : null);
  };

  const finalizationCompleted = finalizing?.jobs.filter(({ status }) => status === 'completed').length ?? 0;
  const finalizationFailed = finalizing?.jobs.filter(({ status }) => status === 'failed').length ?? 0;
  const activeFinalizers = finalizing?.jobs.filter(({ status }) => status === 'running') ?? [];

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
            {progress && <p className="mt-5 text-sm text-tertiary">{progress}</p>}
            {finalizing && <p className="mt-2 text-sm text-tertiary">Finalisierung: {finalizationCompleted}/{finalizing.jobs.length} abgeschlossen{finalizationFailed ? `, ${finalizationFailed} fehlgeschlagen` : ''}</p>}
            {error && <p className="mt-3 text-sm text-error-primary">{error}</p>}
            {creationFailures.length > 0 && <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">{creationFailures.length} fehlgeschlagene Generierungsaufträge</summary><ul className="mt-2 grid gap-1 text-error-primary">{creationFailures.map((failure) => <li key={failure.key}>{failure.label}: {failure.error}</li>)}</ul></details>}
            {finalizationFailed > 0 && !running && <button className="mt-4 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold" onClick={retryFinalizationFailures} type="button">Fehlgeschlagene Finalisierungen erneut versuchen</button>}
            {finalizationFailed > 0 && (
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
            <button className="mt-6 rounded-lg bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={running || !total} onClick={() => void run()} type="button">{running ? 'Serie wird verarbeitet …' : `${total || 0} Arbeitsblätter erstellen`}</button>
            {results.length > 0 && <div className="mt-7"><h3 className="font-semibold">Ergebnisse</h3><ul className="mt-2 grid gap-2">{results.map((result) => <li key={result.id}><Link className="text-sm text-brand-secondary underline" href={`/editor?worksheet=${result.id}`}>{result.title}</Link></li>)}</ul></div>}
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
        </div>
      </div>
    </AppShell>
  );
}
