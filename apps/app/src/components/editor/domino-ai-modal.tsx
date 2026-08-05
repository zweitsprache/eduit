"use client";

import { useEffect, useMemo, useState } from 'react';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import type { DominoPair } from '@/components/editor/domino-node';
import {
  availableUniqueTimes,
  digitalTime,
  informalTime,
  officialTime,
  TIME_MINUTES,
  TIME_REPRESENTATIONS,
  type TimeRepresentation,
  type TimeValue,
} from '@/lib/german-time';
import { useI18n } from '@/components/i18n/locale-provider';

export type DominoAIPreset = 'time-matching';

export type DominoAIGeneratedResult = {
  preset: DominoAIPreset;
  pairs: DominoPair[];
  showFirstAsExample: boolean;
  groupIndex: number;
  groupSize: number;
  leftRepresentation: TimeRepresentation;
  rightRepresentation: TimeRepresentation;
};

function shuffled<T>(values: T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

function formatTimeRepresentation(
  representation: TimeRepresentation,
  hour: number,
  minute: number,
): string {
  if (representation === 'analog') {
    return `[[clock hour=${hour} minute=${minute}]]`;
  }
  if (representation === 'digital') {
    return digitalTime(hour, minute);
  }
  if (representation === 'official') {
    return officialTime(hour, minute);
  }
  return informalTime(hour, minute);
}

export function DominoAIModal({
  onClose,
  onGenerated,
  open,
}: {
  onClose: () => void;
  onGenerated: (result: DominoAIGeneratedResult) => void;
  open: boolean;
}) {
  const { locale } = useI18n();
  const de = locale === 'de';

  const [preset, setPreset] = useState<DominoAIPreset>('time-matching');
  const [left, setLeft] = useState<TimeRepresentation>('analog');
  const [right, setRight] = useState<TimeRepresentation>('digital');
  const [minutes, setMinutes] = useState<number[]>(TIME_MINUTES);
  const [start, setStart] = useState('00:00');
  const [end, setEnd] = useState('23:59');
  const [count, setCount] = useState(11);
  const [shuffle, setShuffle] = useState(false);
  const [showFirstAsExample, setShowFirstAsExample] = useState(false);
  const [multiPage, setMultiPage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPreset('time-matching');
    setLeft('analog');
    setRight('digital');
    setMinutes(TIME_MINUTES);
    setStart('00:00');
    setEnd('23:59');
    setCount(11);
    setShuffle(false);
    setShowFirstAsExample(false);
    setMultiPage(false);
    setError('');
  }, [open]);

  const available = useMemo(() => availableUniqueTimes({
    start,
    end,
    minutes,
    left,
    right,
  }), [end, left, minutes, right, start]);
  const actualCount = Math.min(count, available.length);

  const generate = () => {
    if (preset !== 'time-matching') return;
    if (!minutes.length) {
      setError(de
        ? 'Wähle mindestens einen Minutenwert aus.'
        : 'Select at least one minute value.');
      return;
    }
    if (!available.length) {
      setError(de
        ? 'In diesem Bereich sind keine eindeutigen Zeiten verfügbar.'
        : 'No unique times are available in this range.');
      return;
    }
    const baseTimes = shuffled(available)
      .slice(0, actualCount)
      .sort((first, second) => (
        first.hour * 60 + first.minute - (second.hour * 60 + second.minute)
      ));
    const selectedTimes: TimeValue[] = (shuffle ? shuffled(baseTimes) : baseTimes)
      .map((time, index) => ({
        ...time,
        id: `time-${Date.now()}-${index + 1}`,
      }));
    const pairs: DominoPair[] = selectedTimes.map((time) => ({
      id: `domino-${time.id}`,
      left: formatTimeRepresentation(left, time.hour, time.minute),
      right: formatTimeRepresentation(right, time.hour, time.minute),
    }));
    const maxPairsPerGrid = 11;
    const groupSize = multiPage
      ? Math.max(1, Math.ceil(pairs.length / maxPairsPerGrid))
      : 1;
    onGenerated({
      preset,
      pairs,
      showFirstAsExample,
      groupIndex: 0,
      groupSize,
      leftRepresentation: left,
      rightRepresentation: right,
    });
  };

  return (
    <AIGenerationModal
      error={error}
      onClose={onClose}
      onGenerate={generate}
      open={open}
      pending={false}
      title={de ? 'Domino mit Eduit AI generieren' : 'Generate Domino with Eduit AI'}
    >
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <label className="block text-sm font-semibold text-primary">
          {de ? 'Vorlage' : 'Preset'}
          <select
            className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            onChange={(event) => setPreset(event.target.value as DominoAIPreset)}
            value={preset}
          >
            <option value="time-matching">{de ? 'Uhrzeiten' : 'Times'}</option>
          </select>
        </label>
      </section>

      {preset === 'time-matching' && (
        <section className="mt-4 rounded-xl border border-secondary bg-secondary p-5">
          <div className="grid grid-cols-2 gap-4">
            {([
              [de ? 'Links' : 'Left', left, setLeft, right],
              [de ? 'Rechts' : 'Right', right, setRight, left],
            ] as const).map(([label, value, setValue, unavailable]) => (
              <label className="text-sm font-semibold text-primary" key={label}>
                {label}
                <select
                  className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  onChange={(event) => setValue(event.target.value as TimeRepresentation)}
                  value={value}
                >
                  {TIME_REPRESENTATIONS.map((option) => (
                    <option
                      disabled={option.value === unavailable}
                      key={option.value}
                      value={option.value}
                    >
                      {option.value === 'official'
                        ? (de ? 'Offiziell' : 'Official')
                        : option.value === 'informal'
                          ? (de ? 'Inoffiziell' : 'Informal')
                          : option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <p className="mt-5 text-sm font-semibold text-primary">
            {de ? 'Minuten' : 'Minutes'}
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {TIME_MINUTES.map((minute) => {
              const selected = minutes.includes(minute);
              return (
                <button
                  aria-pressed={selected}
                  className={[
                    'h-9 rounded-md border text-sm font-semibold transition',
                    selected
                      ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                      : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
                  ].join(' ')}
                  key={minute}
                  onClick={() => setMinutes((current) => (
                    selected
                      ? current.filter((value) => value !== minute)
                      : [...current, minute].sort((a, b) => a - b)
                  ))}
                  type="button"
                >
                  00:{String(minute).padStart(2, '0')}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <label className="text-sm font-semibold text-primary">
              {de ? 'Von' : 'From'}
              <input
                className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                onChange={(event) => setStart(event.target.value)}
                type="time"
                value={start}
              />
            </label>
            <label className="text-sm font-semibold text-primary">
              {de ? 'Bis' : 'To'}
              <input
                className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                onChange={(event) => setEnd(event.target.value)}
                type="time"
                value={end}
              />
            </label>
          </div>

          <button
            aria-pressed={showFirstAsExample}
            className={[
              'mt-4 h-10 w-full rounded-md border px-3 text-sm font-semibold transition',
              showFirstAsExample
                ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
            ].join(' ')}
            onClick={() => setShowFirstAsExample((current) => !current)}
            type="button"
          >
            {de ? 'Erstes Paar als Beispiel' : 'Show first pair as example'}:
            {' '}
            {showFirstAsExample ? (de ? 'Ja' : 'Yes') : (de ? 'Nein' : 'No')}
          </button>

          <button
            aria-pressed={shuffle}
            className={[
              'mt-4 h-10 w-full rounded-md border px-3 text-sm font-semibold transition',
              shuffle
                ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
            ].join(' ')}
            onClick={() => setShuffle((current) => !current)}
            type="button"
          >
            {de ? 'Reihenfolge mischen' : 'Shuffle order'}:
            {' '}
            {shuffle ? (de ? 'Ja' : 'Yes') : (de ? 'Nein' : 'No')}
          </button>

          <button
            aria-pressed={multiPage}
            className={[
              'mt-4 h-10 w-full rounded-md border px-3 text-sm font-semibold transition',
              multiPage
                ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
            ].join(' ')}
            onClick={() => setMultiPage((current) => !current)}
            type="button"
          >
            {de ? 'Mehrseitig (je 11 Paare)' : 'Multi-page (11 pairs each)'}:
            {' '}
            {multiPage ? (de ? 'Ja' : 'Yes') : (de ? 'Nein' : 'No')}
          </button>

          <label className="mt-5 block text-sm font-semibold text-primary">
            {de ? 'Anzahl' : 'Number of pairs'}
            <input
              className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              max={multiPage ? 66 : 11}
              min={1}
              onChange={(event) => setCount(Math.min(multiPage ? 66 : 11, Math.max(1, Number(event.target.value))))}
              type="number"
              value={count}
            />
          </label>
          <p className="mt-2 text-xs text-quaternary">
            {multiPage
              ? (de
                  ? 'Bei mehr als 11 Paaren wird der Dominopfad über mehrere Seiten fortgesetzt. START steht auf der ersten Seite, ZIEL auf der letzten.'
                  : 'More than 11 pairs continues the domino trail across pages. START is on the first page, ZIEL on the last.')
              : (available.length < count
                  ? (de
                      ? `${available.length} eindeutige Zeiten verfügbar – es werden ${actualCount} Paare erstellt.`
                      : `${available.length} unique times available — ${actualCount} pairs will be created.`)
                  : (de
                      ? `${available.length} eindeutige Zeiten verfügbar.`
                      : `${available.length} unique times available.`))}
          </p>
        </section>
      )}
    </AIGenerationModal>
  );
}
