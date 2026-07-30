import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';

function normalizedInteger(value: string | null, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(max, Math.max(0, Math.floor(parsed)));
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const hour = normalizedInteger(params.get('hour'), 23);
  const minute = normalizedInteger(params.get('minute'), 59);
  const minuteRotation = minute * 6;
  const hourRotation = (hour % 12) * 30 + minute * 0.5;
  const source = await readFile(
    join(process.cwd(), 'public', 'uhrzeit_analog_1200.svg'),
    'utf8',
  );
  const rendered = source
    .replace(
      'id="minute_hand"',
      `id="minute_hand" transform="rotate(${minuteRotation} 340 340)"`,
    )
    .replace(
      'id="hour_hand"',
      `id="hour_hand" transform="rotate(${hourRotation} 340 340)"`,
    );

  return new Response(rendered, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
