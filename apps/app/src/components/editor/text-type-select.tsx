"use client";

import { RICH_TEXT_TYPE_GROUPS } from '@/lib/rich-text-types';

export function TextTypeSelect({
  autoFocus = false,
  className,
  labelClassName,
  onChange,
  value,
}: {
  autoFocus?: boolean;
  className?: string;
  labelClassName?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={labelClassName ?? 'block text-sm font-semibold text-primary'}>
      Textsorte
      <select
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={className ?? 'mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand'}
      >
        <option value="">Textsorte wählen…</option>
        {RICH_TEXT_TYPE_GROUPS.map((group) => (
          <optgroup key={group.category} label={group.category}>
            {group.types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
