import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { educationalContentModel } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  profession: z.string().trim().min(2).max(120),
  proficiencyLevel: z.enum([
    'A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2',
  ]),
  proficiencyPhase: z.enum([
    'beginning', 'middle', 'towards-end', 'completed',
  ]),
  textType: z.enum(['self-portrait', 'portrait']),
});

const resultSchema = z.object({
  title: z.string().trim().min(2).max(120),
  paragraphs: z.array(z.string().trim().min(10).max(700)).min(2).max(4),
});

function normalizedTokens(value: string) {
  return value
    .toLocaleLowerCase('de-CH')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !['frau', 'mann', 'in'].includes(token));
}

async function resolveProfessionUrl(profession: string) {
  const sitemap = await fetch('https://www.berufsberatung.ch/sitemap.xml', {
    next: { revalidate: 86400 },
  }).then((response) => {
    if (!response.ok) throw new Error('Die Berufsdatenbank ist nicht erreichbar.');
    return response.text();
  });
  const urls = Array.from(sitemap.matchAll(
    /<loc>(https:\/\/www\.berufsberatung\.ch\/de\/berufe\/[^<]+)<\/loc>/g,
  )).map((match) => match[1]);
  const wanted = normalizedTokens(profession);
  const ranked = urls
    .map((url) => {
      const slug = decodeURIComponent(url.split('/').at(-1) ?? '');
      const tokens = normalizedTokens(slug);
      const matches = wanted.filter((token) => tokens.includes(token)).length;
      const starts = tokens[0] === wanted[0] ? 2 : 0;
      return { url, score: matches * 3 + starts - Math.abs(tokens.length - wanted.length) };
    })
    .sort((left, right) => right.score - left.score);
  if (!ranked[0] || ranked[0].score < 3) {
    throw new Error('Kein passender Beruf auf berufsberatung.ch gefunden.');
  }
  return ranked[0].url;
}

function sourceText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30000);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    const input = requestSchema.parse(await request.json());
    const sourceUrl = await resolveProfessionUrl(input.profession);
    const html = await fetch(sourceUrl).then((response) => {
      if (!response.ok) throw new Error('Das Berufsprofil konnte nicht geladen werden.');
      return response.text();
    });
    const facts = sourceText(html);
    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0.2,
      system: `Write short German educational occupation portraits using only
facts present in the supplied source. Never invent duties, training, working
conditions, or requirements. Use Swiss spelling (ss, never ß).`,
      prompt: `Requested profession: ${input.profession}
CEFR sublevel: ${input.proficiencyLevel}
Position within sublevel: ${input.proficiencyPhase}
Text type: ${input.textType === 'self-portrait'
  ? 'Selbstporträt in the first person singular'
  : 'Porträt in the third person'}

Write 2–4 short coherent paragraphs calibrated strictly to the CEFR sublevel.
Use an engaging title. Do not mention the source inside the prose.

SOURCE CONTENT:
${facts}`,
    });
    return Response.json({
      profession: input.profession,
      title: output.title,
      paragraphs: output.paragraphs,
      sourceUrl,
      proficiencyLevel: input.proficiencyLevel,
      proficiencyPhase: input.proficiencyPhase,
      textType: input.textType,
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Ungültige Eingabe.'
      : error instanceof Error ? error.message : 'Generierung fehlgeschlagen.';
    return Response.json({ error: message }, { status: 400 });
  }
}
