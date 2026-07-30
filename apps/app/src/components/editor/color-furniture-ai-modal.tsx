"use client";

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import {
  FURNITURE_COLORS,
  FURNITURE_KINDS,
  generateColorFurnitureItems,
  type ColorFurnitureItem,
  type ColorFurnitureMode,
  type FurnitureColor,
  type FurnitureKind,
} from '@/lib/color-furniture-activities';

export function ColorFurnitureAIModal({
  initialCount,
  onClose,
  onGenerated,
  open,
}: {
  initialCount: number;
  onClose: () => void;
  onGenerated: (result: {
    instruction: string;
    mode: ColorFurnitureMode;
    items: ColorFurnitureItem[];
  }) => void;
  open: boolean;
}) {
  const { locale } = useI18n();
  const de = locale === 'de';
  const [mode, setMode] = useState<ColorFurnitureMode>('mcq');
  const [furnitureKinds, setFurnitureKinds] = useState<FurnitureKind[]>(
    FURNITURE_KINDS.map(({ value }) => value),
  );
  const [colors, setColors] = useState<FurnitureColor[]>(
    FURNITURE_COLORS.map(({ value }) => value),
  );
  const [count, setCount] = useState(4);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode('mcq');
    setFurnitureKinds(FURNITURE_KINDS.map(({ value }) => value));
    setColors(FURNITURE_COLORS.map(({ value }) => value));
    setCount(Math.min(12, Math.max(1, initialCount || 4)));
    setError('');
  }, [initialCount, open]);

  const generate = () => {
    if (!furnitureKinds.length || !colors.length) {
      setError(de
        ? 'Wähle mindestens ein Möbelstück und eine Farbe aus.'
        : 'Select at least one item of furniture and one color.');
      return;
    }
    onGenerated({
      instruction: mode === 'mcq'
        ? 'Wähle die Aussage, die zum Bild passt.'
        : 'Entscheide, ob die Aussage zum Bild passt.',
      mode,
      items: generateColorFurnitureItems({
        count,
        mode,
        furnitureKinds,
        colors,
      }),
    });
  };

  return (
    <AIGenerationModal
      error={error}
      onClose={onClose}
      onGenerate={generate}
      open={open}
      pending={false}
      title={de ? 'Farbenaufgabe generieren' : 'Generate colors activity'}
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
          {de ? 'Möbel' : 'Furniture'}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {FURNITURE_KINDS.map((furniture) => {
            const active = furnitureKinds.includes(furniture.value);
            return (
              <button
                aria-pressed={active}
                className={[
                  'flex min-h-20 flex-col items-center justify-center rounded-md border p-2 text-xs font-semibold transition',
                  active
                    ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                    : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
                ].join(' ')}
                key={furniture.value}
                onClick={() => setFurnitureKinds((current) => (
                  active
                    ? current.filter((value) => value !== furniture.value)
                    : [...current, furniture.value]
                ))}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="size-8 bg-current"
                  style={{
                    maskImage: `url(${furniture.icon})`,
                    maskPosition: 'center',
                    maskRepeat: 'no-repeat',
                    maskSize: 'contain',
                    WebkitMaskImage: `url(${furniture.icon})`,
                    WebkitMaskPosition: 'center',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskSize: 'contain',
                  }}
                />
                <span className="mt-1">{furniture.label}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-sm font-semibold text-primary">
          {de ? 'Farben' : 'Colors'}
        </p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {FURNITURE_COLORS.map((color) => {
            const active = colors.includes(color.value);
            return (
              <button
                aria-pressed={active}
                className={[
                  'flex min-h-16 flex-col items-center justify-center rounded-md border p-2 text-xs font-semibold transition',
                  active
                    ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                    : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
                ].join(' ')}
                key={color.value}
                onClick={() => setColors((current) => (
                  active
                    ? current.filter((value) => value !== color.value)
                    : [...current, color.value]
                ))}
                type="button"
              >
                <span
                  className="size-6 rounded-full border border-secondary"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="mt-1">{color.label}</span>
              </button>
            );
          })}
        </div>

        <label className="mt-5 block text-sm font-semibold text-primary">
          {de ? 'Anzahl' : 'Number of items'}
          <input
            className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            max={12}
            min={1}
            onChange={(event) => setCount(
              Math.min(12, Math.max(1, Number(event.target.value))),
            )}
            type="number"
            value={count}
          />
        </label>
      </section>
    </AIGenerationModal>
  );
}
