export type TimeRepresentation = 'analog' | 'digital' | 'official' | 'informal';

export type TimeValue = {
  id: string;
  hour: number;
  minute: number;
};

const NUMBERS = [
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben',
  'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn',
  'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig',
  'einundzwanzig', 'zweiundzwanzig', 'dreiundzwanzig',
];
const TENS: Record<number, string> = {
  20: 'zwanzig',
  30: 'dreissig',
  40: 'vierzig',
  50: 'fünfzig',
};

function germanNumber(value: number) {
  if (NUMBERS[value]) return NUMBERS[value];
  const tens = Math.floor(value / 10) * 10;
  const ones = value % 10;
  if (!ones) return TENS[tens] ?? String(value);
  const one = ones === 1 ? 'ein' : NUMBERS[ones];
  return `${one}und${TENS[tens] ?? ''}`;
}

export const TIME_REPRESENTATIONS: Array<{
  value: TimeRepresentation;
  label: string;
}> = [
  { value: 'analog', label: 'Analog' },
  { value: 'digital', label: 'Digital' },
  { value: 'official', label: 'Offiziell' },
  { value: 'informal', label: 'Inoffiziell' },
];

export const TIME_MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

export function digitalTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function officialTime(hour: number, minute: number) {
  const hourWord = hour === 1 ? 'ein' : germanNumber(hour);
  return minute === 0
    ? `${hourWord} Uhr`
    : `${hourWord} Uhr ${germanNumber(minute)}`;
}

function informalHour(hour: number) {
  const normalized = hour % 12 || 12;
  return normalized === 1 ? 'eins' : NUMBERS[normalized];
}

export function informalTime(hour: number, minute: number) {
  if (minute === 0) return `${informalHour(hour)} Uhr`;
  if (minute === 15) return `Viertel nach ${informalHour(hour)}`;
  if (minute === 25) return `fünf vor halb ${informalHour(hour + 1)}`;
  if (minute === 30) return `halb ${informalHour(hour + 1)}`;
  if (minute === 35) return `fünf nach halb ${informalHour(hour + 1)}`;
  if (minute === 45) return `Viertel vor ${informalHour(hour + 1)}`;
  if (minute < 30) return `${germanNumber(minute)} nach ${informalHour(hour)}`;
  return `${germanNumber(60 - minute)} vor ${informalHour(hour + 1)}`;
}

export function representationKey(
  value: Pick<TimeValue, 'hour' | 'minute'>,
  representation: TimeRepresentation,
) {
  return representation === 'analog' || representation === 'informal'
    ? `${value.hour % 12}:${value.minute}`
    : digitalTime(value.hour, value.minute);
}

export function availableUniqueTimes(input: {
  start: string;
  end: string;
  minutes: number[];
  left: TimeRepresentation;
  right: TimeRepresentation;
}) {
  const toMinute = (value: string) => {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  };
  const start = Math.max(0, Math.min(1439, toMinute(input.start)));
  const end = Math.max(start, Math.min(1439, toMinute(input.end)));
  const allowedMinutes = new Set(input.minutes);
  const seenLeft = new Set<string>();
  const seenRight = new Set<string>();
  const values: Array<{ hour: number; minute: number }> = [];
  for (let total = start; total <= end; total += 1) {
    const hour = Math.floor(total / 60);
    const minute = total % 60;
    if (!allowedMinutes.has(minute)) continue;
    const value = { hour, minute };
    const leftKey = representationKey(value, input.left);
    const rightKey = representationKey(value, input.right);
    if (seenLeft.has(leftKey) || seenRight.has(rightKey)) continue;
    seenLeft.add(leftKey);
    seenRight.add(rightKey);
    values.push(value);
  }
  return values;
}
