import { Client } from '@upstash/workflow';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { sql } from '@/lib/neon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const configSchema = z.object({
  id: z.string().min(1).max(50),
  tense: z.enum(['present', 'preterite', 'perfect', 'pluperfect', 'future-one', 'future-two']),
  mood: z.enum(['indicative', 'subjunctive-one', 'subjunctive-two']),
  label: z.string().min(1).max(100),
  level: z.enum(['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2']),
});

const inputSchema = z.object({
  infinitives: z.array(z.string().trim().min(2).max(80)).min(1).max(100),
  configs: z.array(configSchema).min(1).max(12),
  brandProfileId: z.string().uuid(),
  publish: z.boolean().default(false),
});

export async function GET(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const batchId = new URL(request.url).searchParams.get('batchId');
  if (!batchId) return NextResponse.json({ error: 'Batch ID is required.' }, { status: 400 });
  const batches = await sql`
    select id, publish, total_jobs as "totalJobs"
    from verb_series_batches
    where id = ${batchId} and (${user.isAdmin} or owner_user_id = ${user.id})
  ` as Array<{ id: string; publish: boolean; totalJobs: number }>;
  if (!batches[0]) return NextResponse.json({ error: 'Batch not found.' }, { status: 404 });
  const jobs = await sql`
    select id, status, worksheet_id as "worksheetId", worksheet_title as title,
      infinitive, label, error
    from verb_series_jobs where batch_id = ${batchId}
    order by created_at, infinitive, label
  `;
  return NextResponse.json({ batch: batches[0], jobs }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!process.env.QSTASH_TOKEN) return NextResponse.json(
    { error: 'Upstash Workflow is not configured.' }, { status: 503 },
  );
  try {
    const input = inputSchema.parse(await request.json());
    const infinitives = [...new Set(input.infinitives.map((value) => value.toLocaleLowerCase('de-DE')))];
    const jobs = infinitives.flatMap((infinitive) => input.configs.map((config) => ({ infinitive, config })));
    const batchRows = await sql`
      insert into verb_series_batches (owner_user_id, publish, total_jobs)
      values (${user.id}, ${input.publish}, ${jobs.length}) returning id
    ` as Array<{ id: string }>;
    const batchId = batchRows[0].id;
    const inserted = await Promise.all(jobs.map(async ({ infinitive, config }) => {
      const rows = await sql`
        insert into verb_series_jobs (
          batch_id, infinitive, config_id, tense, mood, label, level, brand_profile_id
        ) values (
          ${batchId}, ${infinitive}, ${config.id}, ${config.tense}, ${config.mood},
          ${config.label}, ${config.level}, ${input.brandProfileId}
        ) returning id
      ` as Array<{ id: string }>;
      return rows[0].id;
    }));
    const origin = new URL(request.url).origin;
    const client = new Client({ baseUrl: process.env.QSTASH_URL, token: process.env.QSTASH_TOKEN });
    await client.trigger(inserted.map((jobId) => ({
      url: `${origin}/api/automations/verb-series/workflow`,
      body: { jobId, origin },
      label: ['verb-series', batchId, jobId],
      retries: 4,
      retryDelay: 'max(1000, pow(2, retried) * 1000)',
      flowControl: { key: 'verb-series-generation', parallelism: 5, rate: 30, period: '1m' as const },
    })));
    return NextResponse.json({ batchId, queued: inserted.length }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Batch could not be started.' }, { status: 400 });
  }
}
