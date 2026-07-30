export type DateRepresentation = 'calendar' | 'numeric' | 'written';

export type DateValue = {
  id: string;
  date: string;
};

export const DATE_REPRESENTATIONS: Array<{
  value: DateRepresentation;
  label: string;
}> = [
  { value: 'calendar', label: 'Kalender' },
  { value: 'numeric', label: 'TT.MM.YYYY' },
  { value: 'written', label: 'T. MMMMMMM YYYY' },
];

export const GERMAN_MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

export function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;
  return { date, year, month, day };
}

export function numericDate(value: string) {
  const parsed = parseDateValue(value);
  return parsed
    ? `${String(parsed.day).padStart(2, '0')}.${String(parsed.month).padStart(2, '0')}.${parsed.year}`
    : value;
}

export function writtenDate(value: string) {
  const parsed = parseDateValue(value);
  return parsed
    ? `${parsed.day}. ${GERMAN_MONTHS[parsed.month - 1]} ${parsed.year}`
    : value;
}

export function availableDates(start: string, end: string) {
  const first = parseDateValue(start)?.date;
  const last = parseDateValue(end)?.date;
  if (!first || !last || first > last) return [];
  const values: string[] = [];
  for (
    let timestamp = first.getTime();
    timestamp <= last.getTime() && values.length < 10_000;
    timestamp += 86_400_000
  ) {
    values.push(new Date(timestamp).toISOString().slice(0, 10));
  }
  return values;
}
