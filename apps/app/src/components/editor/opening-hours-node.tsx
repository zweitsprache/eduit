"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Clock3 } from 'lucide-react';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';

export type OpeningHoursRow = {
  id: string;
  days: string;
  hours: string;
};

export type OpeningHoursSign = {
  id: string;
  title: string;
  abbreviateWeekdays: boolean;
  rows: OpeningHoursRow[];
};

export type OpeningHoursAttrs = {
  instruction?: string | null;
  showInstruction: boolean;
  signs: OpeningHoursSign[];
};

export function formatOpeningHoursRange(value: string) {
  return value
    .replace(/\s*[-–—]\s*/g, ' – ')
    .replace(/\s*\|\s*/g, ' | ');
}

const WEEKDAY_ABBREVIATIONS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
  montag: 'MO',
  dienstag: 'DI',
  mittwoch: 'MI',
  donnerstag: 'DO',
  freitag: 'FR',
  samstag: 'SA',
  sonntag: 'SO',
};

function formatWeekdays(value: string, abbreviate: boolean) {
  const formatted = formatOpeningHoursRange(value);
  if (!abbreviate) return formatted;
  return formatted.replace(
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\b/gi,
    (weekday) => WEEKDAY_ABBREVIATIONS[weekday.toLowerCase()] ?? weekday,
  );
}

export const DEFAULT_OPENING_HOURS_SIGNS: OpeningHoursSign[] = [
  {
    id: 'opening-hours-sign-1',
    title: 'Library',
    abbreviateWeekdays: false,
    rows: [
      { id: 'opening-hours-row-1', days: 'Monday – Friday', hours: '09:00 – 18:00' },
      { id: 'opening-hours-row-2', days: 'Saturday', hours: '10:00 – 16:00' },
      { id: 'opening-hours-row-3', days: 'Sunday', hours: 'Closed' },
    ],
  },
  {
    id: 'opening-hours-sign-2',
    title: 'Supermarket',
    abbreviateWeekdays: false,
    rows: [
      { id: 'opening-hours-row-4', days: 'Monday – Saturday', hours: '08:00 – 20:00' },
      { id: 'opening-hours-row-5', days: 'Sunday', hours: 'Closed' },
    ],
  },
];

function defaultSigns() {
  return DEFAULT_OPENING_HOURS_SIGNS.map((sign) => ({
    ...sign,
    rows: sign.rows.map((row) => ({ ...row })),
  }));
}

function parseSigns(value: string | null): OpeningHoursSign[] {
  if (!value) return defaultSigns();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultSigns();
    const signs = parsed.flatMap((sign, signIndex): OpeningHoursSign[] => {
      if (!sign || typeof sign !== 'object') return [];
      const rows = Array.isArray(sign.rows)
        ? sign.rows.flatMap((row: unknown, rowIndex: number): OpeningHoursRow[] => {
            if (!row || typeof row !== 'object') return [];
            const candidate = row as Record<string, unknown>;
            return [{
              id: typeof candidate.id === 'string'
                ? candidate.id
                : `opening-hours-row-${signIndex + 1}-${rowIndex + 1}`,
              days: typeof candidate.days === 'string' ? candidate.days : '',
              hours: typeof candidate.hours === 'string' ? candidate.hours : '',
            }];
          })
        : [];
      return [{
        id: typeof sign.id === 'string'
          ? sign.id
          : `opening-hours-sign-${signIndex + 1}`,
        title: typeof sign.title === 'string' ? sign.title : '',
        abbreviateWeekdays: sign.abbreviateWeekdays === true,
        rows: rows.length ? rows : [{
          id: `opening-hours-row-${signIndex + 1}-1`,
          days: '',
          hours: '',
        }],
      }];
    });
    return signs.length ? signs : defaultSigns();
  } catch {
    return defaultSigns();
  }
}

function OpeningHoursNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as OpeningHoursAttrs;
  return (
    <CustomBlockRoot selected={selected} className="opening-hours-node">
      {attrs.showInstruction && (
        <BlockInstruction>
          {attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.openingHours}
        </BlockInstruction>
      )}
      <div className="opening-hours-node__grid">
        {attrs.signs.map((sign) => (
          <section className="opening-hours-node__sign" key={sign.id}>
            <header className="opening-hours-node__header">
              <Clock3 aria-hidden="true" />
              <h3>{sign.title}</h3>
            </header>
            <div className="opening-hours-node__rows">
              {sign.rows.map((row) => (
                <div className="opening-hours-node__row" key={row.id}>
                  <span>{formatWeekdays(row.days, sign.abbreviateWeekdays)}</span>
                  <strong>{formatOpeningHoursRange(row.hours)}</strong>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    openingHours: {
      insertOpeningHours: (attrs?: Partial<OpeningHoursAttrs>) => ReturnType;
    };
  }
}

export const OpeningHours = Node.create({
  name: 'openingHours',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      showInstruction: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-show-instruction') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-show-instruction': String(attributes.showInstruction),
        }),
      },
      signs: {
        default: DEFAULT_OPENING_HOURS_SIGNS,
        parseHTML: (element) => parseSigns(element.getAttribute('data-signs')),
        renderHTML: (attributes) => ({
          'data-signs': encodeURIComponent(JSON.stringify(attributes.signs)),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="opening-hours"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'opening-hours' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(OpeningHoursNodeView);
  },

  addCommands() {
    return {
      insertOpeningHours: (attrs = {}) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: {
          showInstruction: attrs.showInstruction ?? true,
          signs: attrs.signs ?? defaultSigns(),
        },
      }),
    };
  },
});