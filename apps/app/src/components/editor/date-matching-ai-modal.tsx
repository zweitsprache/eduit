"use client";

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import {
  availableDates,
  DATE_REPRESENTATIONS,
  type DateRepresentation,
  type DateValue,
} from '@/lib/german-date';

function shuffled<T>(values: T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

export function DateMatchingAIModal({
  initialCount,
  onClose,
  onGenerated,
  open,
}: {
  initialCount: number;
  onClose: () => void;
  onGenerated: (result: {
    leftRepresentation: DateRepresentation;
    rightRepresentation: DateRepresentation;
    dates: DateValue[];
    rightOrder: string[];
  }) => void;
  open: boolean;
}) {
  const { locale } = useI18n();
  const de = locale === 'de';
  const [left, setLeft] = useState<DateRepresentation>('calendar');
  const [right, setRight] = useState<DateRepresentation>('numeric');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [count, setCount] = useState(6);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const year = new Date().getFullYear();
    setLeft('calendar');
    setRight('numeric');
    setStart(`${year}-01-01`);
    setEnd(`${year}-12-31`);
    setCount(Math.min(20, Math.max(1, initialCount || 6)));
    setError('');
  }, [initialCount, open]);

  const available = useMemo(
    () => availableDates(start, end),
    [end, start],
  );
  const actualCount = Math.min(count, available.length);

  const generate = () => {
    if (!available.length) {
      setError(de
        ? 'In diesem Bereich sind keine eindeutigen Daten verfügbar.'
        : 'No unique dates are available in this range.');
      return;
    }
    const generatedAt = Date.now();
    const dates = shuffled(available).slice(0, actualCount).map((date, index) => ({
      id: `date-${generatedAt}-${index + 1}`,
      date,
    }));
    let rightOrder = shuffled(dates).map(({ id }) => id);
    if (
      rightOrder.length > 1
      && rightOrder.every((id, index) => id === dates[index].id)
    ) {
      rightOrder = [...rightOrder.slice(1), rightOrder[0]];
    }
    onGenerated({
      leftRepresentation: left,
      rightRepresentation: right,
      dates,
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
      title={de ? 'Datums-Zuordnung generieren' : 'Generate date matching'}
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
                onChange={(event) => setValue(event.target.value as DateRepresentation)}
                value={value}
              >
                {DATE_REPRESENTATIONS.map((option) => (
                  <option
                    disabled={option.value === unavailable}
                    key={option.value}
                    value={option.value}
                  >
                    {option.value === 'calendar'
                      ? (de ? 'Kalender' : 'Calendar')
                      : option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-primary">
            {de ? 'Von' : 'From'}
            <input
              className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              onChange={(event) => setStart(event.target.value)}
              type="date"
              value={start}
            />
          </label>
          <label className="text-sm font-semibold text-primary">
            {de ? 'Bis' : 'To'}
            <input
              className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              onChange={(event) => setEnd(event.target.value)}
              type="date"
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
                ? `${available.length} eindeutige Daten verfügbar – es werden ${actualCount} Elemente erstellt.`
                : `${available.length} unique dates available — ${actualCount} items will be created.`)
            : (de
                ? `${available.length} eindeutige Daten verfügbar.`
                : `${available.length} unique dates available.`)}
        </p>
      </section>
    </AIGenerationModal>
  );
}
