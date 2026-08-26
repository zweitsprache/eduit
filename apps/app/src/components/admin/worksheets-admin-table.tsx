"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loading01, RefreshCw05, SearchLg, UploadCloud01 } from '@untitledui/icons';
import type { Worksheet, WorksheetStatus } from '@/lib/worksheet-types';
import { cx } from '@/utils/cx';

const LANGUAGE_LEVEL_OPTIONS = [
  'A1.1',
  'A1.2',
  'A1+',
  'A2.1',
  'A2.2',
  'A2+',
  'B1.1',
  'B1.2',
  'B1+',
] as const;

const ACTION_FIELD_OPTIONS = [
  'Deutschkurs',
  'Gesundheit',
  'Sicherheit und Notfälle',
  'Familie und Partnerschaft',
  'Kinder und Schule',
  'Soziales Netz',
  'Beratung und Unterstützung',
  'Einkaufen',
  'Ernährung',
  'Wohnen',
  'Mobilität',
  'Finanzen und Versicherungen',
  'Behörden',
  'Freizeit und Hobbys',
  'Kultur und Identität',
  'Arbeit',
  'Arbeitssuche',
  'Umwelt und Klima',
  'Technologie',
  'Weiterbildung',
] as const;

const STATUS_OPTIONS: Array<'all' | WorksheetStatus> = ['all', 'draft', 'published'];
const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;
const PUBLISH_CONCURRENCY = 2;

const CELL_INPUT_CLASS =
  'w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-secondary outline-none transition hover:border-primary focus:border-brand focus:bg-primary focus:ring-2 focus:ring-brand';

// Human labels for the block "data-type" values used as node names in content_html.
const BLOCK_TYPE_LABELS: Record<string, string> = {
  'anagram-node': 'Anagramm',
  'article-plural': 'Artikel-/Plural-Training',
  'choose-correct-words': 'Wortwahl',
  'color-furniture': 'Möbel Farben',
  'communication-cards': 'Kommunikationskarten',
  messenger: 'Messenger',
  email: 'E-Mail',
  crossword: 'Kreuzworträtsel',
  'date-matching': 'Datum Zuordnen',
  'declination-table': 'Deklinationstabelle',
  dialogue: 'Dialog',
  domino: 'Domino',
  'error-correction': 'Fehlerkorrektur',
  'family-kinship': 'Familie',
  'fill-in-the-blank': 'Lückentext',
  'frayer-model': 'Frayer-Modell',
  'german-verb-table': 'Verbtabelle',
  'glossary-terms': 'Glossar',
  'information-gap-activity': 'Informationslücke',
  'inline-choice': 'Auswahl im Text',
  'learning-cards': 'Lernkarten',
  'learning-objective': 'Lernziel',
  lesetraining: 'Lesetraining',
  'letter-cloud': 'Buchstabenwolke',
  'letter-node': 'Buchstaben',
  'matching-pairs': 'Zuordnung',
  mch: 'Multiple Choice',
  mcm: 'Multiple Choice (mehrfach)',
  mcq: 'Multiple Choice',
  'mini-form': 'Formular',
  'occupation-portrait': 'Berufsporträt',
  'opening-hours': 'Öffnungszeiten',
  ordering: 'Reihenfolge',
  'rewrite-sentences': 'Sätze umschreiben',
  'sorting-categories': 'Sortieren',
  'time-matching': 'Zeit Zuordnen',
  timetable: 'Stundenplan',
  'true-false': 'Richtig/Falsch',
  'two-way-prepositions': 'Präpositionen',
  weather: 'Wetter',
  'word-bank': 'Wortspeicher',
  'word-grid': 'Buchstabengitter',
  'worksheet-table': 'Tabelle',
};

type Row = {
  id: string;
  title: string;
  status: WorksheetStatus;
  languageLevel: string;
  actionField: string;
  blockTypes: string[];
  headingText: string | null;
  updatedAt: string;
};

type PublishState = 'queued' | 'running' | 'success' | 'error';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-CH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function WorksheetsAdminTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [actionFieldFilter, setActionFieldFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | WorksheetStatus>('all');
  const [page, setPage] = useState(1);
  const [publishQueue, setPublishQueue] = useState<string[]>([]);
  const [publishActive, setPublishActive] = useState<string[]>([]);
  const [publishStates, setPublishStates] = useState<Map<string, PublishState>>(new Map());
  const publishErrorsRef = useRef<Map<string, string>>(new Map());
  // Title inputs mutate row.title on every keystroke for the optimistic UI, so
  // the last-saved title must be tracked separately to detect real changes on blur.
  const savedTitlesRef = useRef<Map<string, string>>(new Map());
  const savedHeadingsRef = useRef<Map<string, string>>(new Map());

  // Debounce free-text search so typing doesn't trigger a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(queryInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    setPage(1);
  }, [query, levelFilter, actionFieldFilter, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (levelFilter !== 'all') params.set('level', levelFilter);
      if (actionFieldFilter !== 'all') params.set('actionField', actionFieldFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      const response = await fetch(`/api/worksheets/admin-list?${params.toString()}`, {
        cache: 'no-store',
      });
      const result = await response.json() as {
        items?: Row[];
        total?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? 'Failed to load worksheets.');
      setRows(result.items ?? []);
      setTotal(result.total ?? 0);
      savedTitlesRef.current = new Map((result.items ?? []).map((item) => [item.id, item.title]));
      savedHeadingsRef.current = new Map(
        (result.items ?? [])
          .filter((item): item is Row & { headingText: string } => item.headingText !== null)
          .map((item) => [item.id, item.headingText]),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load worksheets.');
    } finally {
      setLoading(false);
    }
  }, [actionFieldFilter, levelFilter, page, query, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Feed queued publish jobs into the active set, up to PUBLISH_CONCURRENCY at a time.
  useEffect(() => {
    if (publishActive.length >= PUBLISH_CONCURRENCY || publishQueue.length === 0) return;
    const capacity = PUBLISH_CONCURRENCY - publishActive.length;
    const next = publishQueue.slice(0, capacity);
    setPublishQueue((current) => current.slice(next.length));
    setPublishActive((current) => [...current, ...next]);
    setPublishStates((current) => {
      const map = new Map(current);
      next.forEach((id) => map.set(id, 'running'));
      return map;
    });
  }, [publishActive, publishQueue]);

  // Full publish (PDF + solution key + thumbnails + Dazit metadata) runs client-side
  // inside the editor, so background jobs are driven by hidden iframes that report
  // back via postMessage — same mechanism the automations page uses.
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin
        || event.data?.type !== 'eduit-automation-item-complete'
      ) return;
      const { worksheetId, success, error: publishError } = event.data as {
        worksheetId: string;
        success: boolean;
        error?: string;
      };
      setPublishActive((current) => current.filter((id) => id !== worksheetId));
      setPublishStates((current) => {
        const map = new Map(current);
        map.set(worksheetId, success ? 'success' : 'error');
        return map;
      });
      if (!success) {
        publishErrorsRef.current.set(worksheetId, publishError ?? 'Publishing failed.');
      } else {
        publishErrorsRef.current.delete(worksheetId);
        void load();
      }
      window.setTimeout(() => {
        setPublishStates((current) => {
          if (current.get(worksheetId) !== (success ? 'success' : 'error')) return current;
          const map = new Map(current);
          map.delete(worksheetId);
          return map;
        });
      }, success ? 4000 : 8000);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [load]);

  function requestPublish(id: string) {
    if (publishActive.includes(id) || publishQueue.includes(id)) return;
    publishErrorsRef.current.delete(id);
    setPublishStates((current) => new Map(current).set(id, 'queued'));
    setPublishQueue((current) => [...current, id]);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const saveField = useCallback(async (
    id: string,
    patch: { title?: string; context?: Worksheet['context'] },
  ) => {
    setSavingIds((current) => new Set(current).add(id));
    setError(null);
    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, worksheet: patch }),
      });
      const result = await response.json() as { worksheet?: Worksheet; error?: string };
      if (!response.ok || !result.worksheet) {
        throw new Error(result.error ?? 'Failed to save changes.');
      }
      const saved = result.worksheet;
      savedTitlesRef.current.set(saved.id, saved.title);
      setRows((current) => current.map((item) => (
        item.id === saved.id
          ? {
            ...item,
            title: saved.title,
            status: saved.status,
            languageLevel: saved.context.languageLevel,
            actionField: saved.context.actionField,
            updatedAt: saved.updatedAt,
          }
          : item
      )));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save changes.');
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }, []);

  // The context column must be saved whole, so fetch the full worksheet first
  // to avoid wiping out fields not shown in this lightweight list.
  const saveContextField = useCallback(async (
    id: string,
    field: 'languageLevel' | 'actionField',
    value: string,
  ) => {
    setSavingIds((current) => new Set(current).add(id));
    setError(null);
    try {
      const response = await fetch(`/api/worksheets?id=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const result = await response.json() as { worksheet?: Worksheet; error?: string };
      if (!response.ok || !result.worksheet) {
        throw new Error(result.error ?? 'Failed to load worksheet.');
      }
      await saveField(id, { context: { ...result.worksheet.context, [field]: value } });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save changes.');
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }, [saveField]);

  // Heading text lives inside content_html, not the lightweight row, so it has
  // its own save endpoint that rewrites just the first H1 node server-side.
  const saveHeadingText = useCallback(async (id: string, headingText: string) => {
    setSavingIds((current) => new Set(current).add(id));
    setError(null);
    try {
      const response = await fetch('/api/worksheets/heading', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, headingText }),
      });
      const result = await response.json() as {
        headingText?: string;
        updatedAt?: string;
        error?: string;
      };
      if (!response.ok || typeof result.headingText !== 'string' || !result.updatedAt) {
        throw new Error(result.error ?? 'Failed to save heading.');
      }
      savedHeadingsRef.current.set(id, result.headingText);
      setRows((current) => current.map((item) => (
        item.id === id
          ? { ...item, headingText: result.headingText as string, updatedAt: result.updatedAt as string }
          : item
      )));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save heading.');
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }, []);

  function updateTitle(id: string, title: string) {
    setRows((current) => current.map((item) => (item.id === id ? { ...item, title } : item)));
  }

  function commitTitle(row: Row, title: string) {
    const trimmed = title.trim();
    if (!trimmed || trimmed === savedTitlesRef.current.get(row.id)) return;
    void saveField(row.id, { title: trimmed });
  }

  function updateHeadingText(id: string, headingText: string) {
    setRows((current) => current.map((item) => (item.id === id ? { ...item, headingText } : item)));
  }

  function commitHeadingText(row: Row, headingText: string) {
    const trimmed = headingText.trim();
    if (!trimmed || trimmed === savedHeadingsRef.current.get(row.id)) return;
    void saveHeadingText(row.id, trimmed);
  }

  function commitLevel(row: Row, languageLevel: string) {
    if (languageLevel === row.languageLevel) return;
    setRows((current) => current.map((item) => (
      item.id === row.id ? { ...item, languageLevel } : item
    )));
    void saveContextField(row.id, 'languageLevel', languageLevel);
  }

  function commitActionField(row: Row, actionField: string) {
    if (actionField === row.actionField) return;
    setRows((current) => current.map((item) => (
      item.id === row.id ? { ...item, actionField } : item
    )));
    void saveContextField(row.id, 'actionField', actionField);
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, page * PAGE_SIZE);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-primary">Worksheets</h1>
        <p className="text-sm text-tertiary">
          Search, filter, and quickly edit worksheet metadata.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <SearchLg className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
          <input
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by title…"
            className="w-full rounded-md border border-primary bg-primary py-2 pl-9 pr-3 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value)}
          className="rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
        >
          <option value="all">All Niveaus</option>
          {LANGUAGE_LEVEL_OPTIONS.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <select
          value={actionFieldFilter}
          onChange={(event) => setActionFieldFilter(event.target.value)}
          className="rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
        >
          <option value="all">All Handlungsfelder</option>
          {ACTION_FIELD_OPTIONS.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | WorksheetStatus)}
          className="rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
        >
          {STATUS_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value === 'all' ? 'All statuses' : value}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-md border border-error bg-error-secondary px-3 py-2 text-sm text-error-primary">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-primary bg-primary">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col className="w-[32%]" />
            <col className="w-[7%]" />
            <col className="w-[18%]" />
            <col className="w-[21%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-secondary bg-secondary/40 text-xs font-semibold uppercase tracking-wide text-quaternary">
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Niveau</th>
              <th className="px-3 py-2">Handlungsfeld</th>
              <th className="px-3 py-2">Blocks</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Publish</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-tertiary">
                  Loading worksheets…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-tertiary">
                  No worksheets match your filters.
                </td>
              </tr>
            )}
            {!loading && rows.map((row) => (
              <Fragment key={row.id}>
                <tr
                  className={cx(
                    'border-b border-secondary/60 last:border-b-0',
                    savingIds.has(row.id) && 'opacity-60',
                  )}
                >
                <td className="px-1 py-1">
                  <input
                    value={row.title}
                    onChange={(event) => updateTitle(row.id, event.target.value)}
                    onBlur={(event) => commitTitle(row, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                    }}
                    className={CELL_INPUT_CLASS}
                  />
                </td>
                <td className="px-1 py-1">
                  <select
                    value={row.languageLevel}
                    onChange={(event) => commitLevel(row, event.target.value)}
                    className={CELL_INPUT_CLASS}
                  >
                    <option value="">—</option>
                    {LANGUAGE_LEVEL_OPTIONS.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <select
                    value={row.actionField}
                    onChange={(event) => commitActionField(row, event.target.value)}
                    className={CELL_INPUT_CLASS}
                  >
                    <option value="">—</option>
                    {ACTION_FIELD_OPTIONS.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {row.blockTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-tertiary"
                      >
                        {BLOCK_TYPE_LABELS[type] ?? type}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-1.5 text-sm text-tertiary">{row.status}</td>
                <td className="px-3 py-1.5 whitespace-nowrap text-sm text-tertiary">
                  {formatDate(row.updatedAt)}
                </td>
                <td className="px-3 py-1.5">
                  <PublishCell
                    state={publishStates.get(row.id)}
                    status={row.status}
                    error={publishErrorsRef.current.get(row.id)}
                    onPublish={() => requestPublish(row.id)}
                  />
                </td>
                </tr>
                <tr
                  className={cx(
                    'border-b border-secondary bg-secondary/30 last:border-b-0',
                    savingIds.has(row.id) && 'opacity-60',
                  )}
                >
                  <td colSpan={7} className="px-1 py-1">
                    <div className="flex items-center gap-2 pl-2">
                      <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-quaternary">
                        H1
                      </span>
                      {row.headingText === null ? (
                        <span className="text-xs text-quaternary">No H1 heading in this worksheet.</span>
                      ) : (
                        <input
                          value={row.headingText}
                          onChange={(event) => updateHeadingText(row.id, event.target.value)}
                          onBlur={(event) => commitHeadingText(row, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') event.currentTarget.blur();
                          }}
                          placeholder="H1 heading text"
                          className={cx(CELL_INPUT_CLASS, 'flex-1')}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-tertiary">
        <span>
          {total === 0
            ? '0 results'
            : `${rangeStart}–${rangeEnd} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 rounded-md border border-primary px-2.5 py-1.5 font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
            Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || loading}
            className="flex items-center gap-1 rounded-md border border-primary px-2.5 py-1.5 font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {publishActive.map((id) => (
        <iframe
          key={id}
          aria-hidden="true"
          title={`Background publish: ${id}`}
          src={`/editor?worksheet=${encodeURIComponent(id)}&automation=batch-full-publish`}
          className="pointer-events-none fixed -left-[10000px] top-0 h-[900px] w-[1200px] opacity-0"
        />
      ))}
    </div>
  );
}

function PublishCell({
  state,
  status,
  error: publishError,
  onPublish,
}: {
  state: PublishState | undefined;
  status: WorksheetStatus;
  error: string | undefined;
  onPublish: () => void;
}) {
  if (state === 'queued' || state === 'running') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-tertiary">
        <Loading01 className="size-4 animate-spin" />
        {state === 'queued' ? 'Queued…' : 'Publishing…'}
      </span>
    );
  }
  if (state === 'success') {
    return <span className="text-xs font-semibold text-success-primary">Published</span>;
  }
  return (
    <button
      type="button"
      onClick={onPublish}
      title={state === 'error' ? publishError ?? 'Publishing failed. Try again.' : undefined}
      className={cx(
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition',
        state === 'error'
          ? 'border-error bg-error-secondary text-error-primary hover:bg-error-secondary_hover'
          : 'border-primary text-secondary hover:bg-primary_hover',
      )}
    >
      {status === 'published'
        ? <RefreshCw05 className="size-3.5" />
        : <UploadCloud01 className="size-3.5" />}
      {state === 'error' ? 'Retry' : status === 'published' ? 'Republish' : 'Publish'}
    </button>
  );
}
