"use client";

import { useEffect, useState } from 'react';
import { Toggle } from '@/components/base/toggle/toggle';
import { useI18n } from '@/components/i18n/locale-provider';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import {
  generateWeatherItems,
  SWISS_CITIES,
  WEATHER_KINDS,
  type WeatherItem,
  type WeatherKind,
  type WeatherMode,
} from '@/lib/weather-activities';

export function WeatherAIModal({
  initialCount,
  onClose,
  onGenerated,
  open,
}: {
  initialCount: number;
  onClose: () => void;
  onGenerated: (result: {
    instruction: string;
    mode: WeatherMode;
    items: WeatherItem[];
    questionOrder: string[];
  }) => void;
  open: boolean;
}) {
  const { locale } = useI18n();
  const de = locale === 'de';
  const [mode, setMode] = useState<WeatherMode>('mcq');
  const [weatherKinds, setWeatherKinds] = useState<WeatherKind[]>(
    WEATHER_KINDS.map(({ value }) => value),
  );
  const [minTemperature, setMinTemperature] = useState(-10);
  const [maxTemperature, setMaxTemperature] = useState(30);
  const [count, setCount] = useState(4);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [varyWeekdayAndCity, setVaryWeekdayAndCity] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode('mcq');
    setWeatherKinds(WEATHER_KINDS.map(({ value }) => value));
    setMinTemperature(-10);
    setMaxTemperature(30);
    setCount(Math.min(12, Math.max(1, initialCount || 4)));
    setShuffleQuestions(true);
    setVaryWeekdayAndCity(true);
    setError('');
  }, [initialCount, open]);

  const generate = () => {
    if (!weatherKinds.length) {
      setError(de
        ? 'Wähle mindestens ein Wettersymbol aus.'
        : 'Select at least one weather symbol.');
      return;
    }
    if (minTemperature > maxTemperature) {
      setError(de
        ? 'Die Mindesttemperatur muss kleiner als die Höchsttemperatur sein.'
        : 'Minimum temperature must not exceed maximum temperature.');
      return;
    }
    const items = generateWeatherItems({
      count: Math.min(count, SWISS_CITIES.length),
      mode,
      weatherKinds,
      minTemperature,
      maxTemperature,
      varyWeekdayAndCity,
    });
    const questionOrder = items.map(({ id }) => id);
    if (shuffleQuestions) {
      for (let index = questionOrder.length - 1; index > 0; index -= 1) {
        const target = Math.floor(Math.random() * (index + 1));
        [questionOrder[index], questionOrder[target]] = [
          questionOrder[target],
          questionOrder[index],
        ];
      }
      if (
        questionOrder.length > 1
        && questionOrder.every((id, index) => id === items[index].id)
      ) {
        [questionOrder[0], questionOrder[1]] = [questionOrder[1], questionOrder[0]];
      }
    }
    onGenerated({
      instruction: mode === 'mcq'
        ? 'Wähle die Aussage, die zur Wetterkarte passt.'
        : 'Entscheide, ob die Aussage zur Wetterkarte passt.',
      mode,
      items,
      questionOrder,
    });
  };

  return (
    <AIGenerationModal
      error={error}
      onClose={onClose}
      onGenerate={generate}
      open={open}
      pending={false}
      title={de ? 'Wetteraufgabe generieren' : 'Generate weather activity'}
    >
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <p className="text-sm font-semibold text-primary">
          {de ? 'Aufgabentyp' : 'Activity type'}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([
            ['mcq', de ? 'Multiple Choice' : 'Multiple choice'],
            ['trueFalse', de ? 'Richtig / falsch' : 'True / false'],
          ] as const).map(([value, label]) => (
            <button
              aria-pressed={mode === value}
              className={[
                'h-10 rounded-md border px-3 text-sm font-semibold transition',
                mode === value
                  ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                  : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
              ].join(' ')}
              key={value}
              onClick={() => setMode(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm font-semibold text-primary">
          {de ? 'Wettersymbole' : 'Weather symbols'}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WEATHER_KINDS.map((weather) => {
            const selected = weatherKinds.includes(weather.value);
            return (
              <button
                aria-pressed={selected}
                className={[
                  'flex min-h-20 flex-col items-center justify-center rounded-md border p-2 text-xs font-semibold transition',
                  selected
                    ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                    : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
                ].join(' ')}
                key={weather.value}
                onClick={() => setWeatherKinds((current) => (
                  selected
                    ? current.filter((value) => value !== weather.value)
                    : [...current, weather.value]
                ))}
                type="button"
              >
                <img alt="" className="size-8 object-contain" src={weather.icon} />
                <span className="mt-1">{weather.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-primary">
            {de ? 'Min. Temperatur' : 'Min. temperature'}
            <input
              className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              max={50}
              min={-30}
              onChange={(event) => setMinTemperature(Number(event.target.value))}
              type="number"
              value={minTemperature}
            />
          </label>
          <label className="text-sm font-semibold text-primary">
            {de ? 'Max. Temperatur' : 'Max. temperature'}
            <input
              className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              max={50}
              min={-30}
              onChange={(event) => setMaxTemperature(Number(event.target.value))}
              type="number"
              value={maxTemperature}
            />
          </label>
        </div>

        <label className="mt-5 block text-sm font-semibold text-primary">
          {de ? 'Anzahl' : 'Number of items'}
          <input
            className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            max={12}
            min={1}
            onChange={(event) => setCount(Math.min(12, Math.max(1, Number(event.target.value))))}
            type="number"
            value={count}
          />
        </label>

        <div className="mt-5">
          <Toggle
            hint={de
              ? 'Die Karten bleiben nummeriert; die Aufgaben darunter erscheinen in einer anderen Reihenfolge.'
              : 'Cards remain numbered; the questions below appear in a different order.'}
            isSelected={shuffleQuestions}
            label={de ? 'Aufgabenreihenfolge mischen' : 'Shuffle question order'}
            onChange={setShuffleQuestions}
          />
        </div>

        {mode === 'mcq' ? (
          <div className="mt-5">
            <Toggle
              hint={de
                ? 'Eine falsche Antwort verändert den Wochentag, eine weitere die Stadt.'
                : 'One incorrect answer changes the weekday and another changes the city.'}
              isSelected={varyWeekdayAndCity}
              label={de
                ? 'Wochentag und Stadt variieren'
                : 'Vary weekday and city'}
              onChange={setVaryWeekdayAndCity}
            />
          </div>
        ) : null}
      </section>
    </AIGenerationModal>
  );
}
