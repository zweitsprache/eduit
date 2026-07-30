"use client";

import { useEffect, useMemo, useState } from 'react';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import {
  availableUniqueTimes,
  TIME_MINUTES,
  TIME_REPRESENTATIONS,
  type TimeRepresentation,
  type TimeValue,
} from '@/lib/german-time';
import { useI18n } from '@/components/i18n/locale-provider';

function shuffled<T>(values: T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

export function TimeMatchingAIModal({
  initialCount,
  onClose,
  onGenerated,
  open,
}: {
  initialCount: number;
  onClose: () => void;
  onGenerated: (result: {
    leftRepresentation: TimeRepresentation;
    rightRepresentation: TimeRepresentation;
    times: TimeValue[];
    rightOrder: string[];
  }) => void;
  open: boolean;
}) {
  const { locale } = useI18n();
  const de = locale === 'de';
  const [left, setLeft] = useState<TimeRepresentation>('analog');
  const [right, setRight] = useState<TimeRepresentation>('digital');
  const [minutes, setMinutes] = useState<number[]>(TIME_MINUTES);
  const [start, setStart] = useState('00:00');
  const [end, setEnd] = useState('23:59');
  const [count, setCount] = useState(6);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLeft('analog');
    setRight('digital');
    setMinutes(TIME_MINUTES);
    setStart('00:00');
    setEnd('23:59');
    setCount(Math.min(20, Math.max(1, initialCount || 6)));
    setError('');
  }, [initialCount, open]);

  const available = useMemo(() => availableUniqueTimes({
    start,
    end,
    minutes,
    left,
    right,
  }), [end, left, minutes, right, start]);
  const actualCount = Math.min(count, available.length);

  const generate = () => {
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
    const times = shuffled(available).slice(0, actualCount).map((time, index) => ({
      ...time,
      id: `time-${Date.now()}-${index + 1}`,
    }));
    let rightOrder = shuffled(times).map(({ id }) => id);
    if (
      rightOrder.length > 1
      && rightOrder.every((id, index) => id === times[index].id)
    ) {
      rightOrder = [...rightOrder.slice(1), rightOrder[0]];
    }
    onGenerated({
      leftRepresentation: left,
      rightRepresentation: right,
      times,
      rightOrder,
    });
  };

  return (
    <AIGenerationModal
      error={error}
      onClose={onClose}
      onGenerate={generate}
      open={open}
      pending={false}
      title={de ? 'Zeit-Zuordnung generieren' : 'Generate time matching'}
    >
      <section className="rounded-xl border border-secondary bg-secondary p-5">
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

        <label className="mt-5 block text-sm font-semibold text-primary">
          {de ? 'Anzahl' : 'Number of items'}
          <input
            className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            max={20}
            min={1}
            onChange={(event) => setCount(Math.min(20, Math.max(1, Number(event.target.value))))}
            type="number"
            value={count}
          />
        </label>
        <p className="mt-2 text-xs text-quaternary">
          {available.length < count
            ? (de
                ? `${available.length} eindeutige Zeiten verfügbar – es werden ${actualCount} Elemente erstellt.`
                : `${available.length} unique times available — ${actualCount} items will be created.`)
            : (de
                ? `${available.length} eindeutige Zeiten verfügbar.`
                : `${available.length} unique times available.`)}
        </p>
      </section>
    </AIGenerationModal>
  );
}
