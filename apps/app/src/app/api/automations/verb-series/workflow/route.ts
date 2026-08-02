import { serve } from '@upstash/workflow/nextjs';
import { sql } from '@/lib/neon';
import { createWorksheet } from '@/lib/worksheets';
import { buildVerbLearningCards, type VerbMood, type VerbResult, type VerbTense } from '@/lib/verb-learning-card-builder';
import { EMPTY_WORKSHEET_CONTEXT } from '@/lib/worksheet-types';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Payload = { jobId: string; origin: string };
type Job = {
  id: string; ownerUserId: string; infinitive: string; configId: string; tense: VerbTense;
  mood: VerbMood; label: string; level: string; brandProfileId: string;
};

const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function worksheetHtml(title: string, items: unknown[]) {
  const attrs = `data-title="${escape(title)}" data-format="a8-landscape" data-sidedness="double" data-items="${escape(encodeURIComponent(JSON.stringify(items)))}" data-group-index="0" data-type="learning-cards"`;
  return `<div ${attrs} data-sheet-side="front"></div><div ${attrs} data-sheet-side="back"></div>`;
}

export const { POST } = serve<Payload>(async (context) => {
  const { jobId, origin } = context.requestPayload;
  await context.run('generate-and-create-worksheet', async () => {
    const rows = await sql`
      select j.id, b.owner_user_id as "ownerUserId", j.infinitive,
        j.config_id as "configId", j.tense, j.mood, j.label, j.level,
        j.brand_profile_id as "brandProfileId"
      from verb_series_jobs j join verb_series_batches b on b.id = j.batch_id
      where j.id = ${jobId}
    ` as Job[];
    const job = rows[0];
    if (!job) return;
    const completed = await sql`select worksheet_id from verb_series_jobs where id = ${jobId} and status = 'completed'`;
    if (completed.length) return;
    await sql`update verb_series_jobs set status = 'running', error = null, updated_at = now() where id = ${jobId}`;
    try {
      const token = process.env.QSTASH_TOKEN;
      if (!token) throw new Error('Workflow credentials are missing.');
      const response = await fetch(`${origin}/api/ai/german-verb-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-eduit-workflow-token': token },
        body: JSON.stringify({ infinitive: job.infinitive, tense: job.tense, mood: job.mood }),
      });
      const generated = await response.json().catch(() => ({})) as VerbResult & { error?: string };
      if (!response.ok || !generated.forms) throw new Error(generated.error ?? 'Verb forms could not be generated.');
      const cards = buildVerbLearningCards(
        generated, job.tense, job.mood,
        job.configId === 'subjunctive-two-past' ? 'Vergangenheit' : undefined,
      );
      const worksheet = await createWorksheet(job.ownerUserId, {
        title: cards.title,
        contentHtml: worksheetHtml(cards.title, cards.items),
        documentSize: 'a4-portrait', showSolutions: false, status: 'draft',
        brandProfileId: job.brandProfileId,
        context: { ...EMPTY_WORKSHEET_CONTEXT, worksheetLanguage: 'de-formal', subject: 'Deutsch', learnerStage: 'adult-education', contentLanguage: 'German', languageLevel: job.level },
      });
      if (!worksheet) throw new Error('Worksheet could not be created.');
      await sql`
        update verb_series_jobs set status = 'completed', worksheet_id = ${worksheet.id},
          worksheet_title = ${cards.title}, error = null, updated_at = now() where id = ${jobId}
      `;
    } catch (error) {
      await sql`
        update verb_series_jobs set status = 'running', error = ${error instanceof Error ? error.message : 'Generation failed.'},
          updated_at = now() where id = ${jobId}
      `;
      throw error;
    }
  });
}, {
  failureFunction: async ({ context, failResponse }) => {
    const { jobId } = context.requestPayload;
    await sql`
      update verb_series_jobs set status = 'failed', error = ${failResponse.slice(0, 2000)},
        updated_at = now() where id = ${jobId}
    `;
  },
});
