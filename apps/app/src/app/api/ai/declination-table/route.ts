import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { educationalContentModel } from '@/lib/ai';
import type {
  DeclinationBaseForms,
  DeclinationCaseKey,
  DeclinationCaseRow,
  DeclinationGenderKey,
} from '@/components/editor/declination-table-node';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  nouns: z.object({
    masculine: z.string().trim().min(1).max(80),
    feminine: z.string().trim().min(1).max(80),
    neuter: z.string().trim().min(1).max(80),
    plural: z.string().trim().min(1).max(80),
  }),
  adjectives: z.object({
    masculine: z.string().trim().max(80),
    feminine: z.string().trim().max(80),
    neuter: z.string().trim().max(80),
    plural: z.string().trim().max(80),
  }),
});

const formsSchema = z.tuple([
  z.string().trim().min(1).max(80),
  z.string().trim().min(1).max(80),
  z.string().trim().min(1).max(80),
]);

const entrySchema = z.object({
  article: formsSchema,
  adjective: formsSchema,
  noun: formsSchema,
});

const rowSchema = z.object({
  key: z.enum(['nom', 'akk', 'dat', 'gen']),
  values: z.object({
    masculine: entrySchema,
    feminine: entrySchema,
    neuter: entrySchema,
    plural: entrySchema,
  }),
});

const resultSchema = z.object({
  rows: z.array(rowSchema).length(4),
});

const CASE_ORDER: DeclinationCaseKey[] = ['nom', 'akk', 'dat', 'gen'];
const GENDER_ORDER: DeclinationGenderKey[] = [
  'masculine',
  'feminine',
  'neuter',
  'plural',
];

function normalizeAdjectives(values: Record<DeclinationGenderKey, string>) {
  const trimmed = {
    masculine: values.masculine.trim(),
    feminine: values.feminine.trim(),
    neuter: values.neuter.trim(),
    plural: values.plural.trim(),
  };
  const populated = GENDER_ORDER.filter((key) => Boolean(trimmed[key]));
  if (!populated.length) {
    throw new Error('Bitte gib mindestens 1 Adjektiv ein.');
  }
  if (populated.length === 1) {
    const value = trimmed[populated[0]];
    return {
      masculine: value,
      feminine: value,
      neuter: value,
      plural: value,
    };
  }
  if (populated.length !== 4) {
    throw new Error('Bitte gib entweder 1 oder 4 Adjektive ein.');
  }
  return trimmed;
}

function normalizeRows(rows: z.infer<typeof rowSchema>[]): DeclinationCaseRow[] {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return CASE_ORDER.map((key) => {
    const row = byKey.get(key);
    if (!row) {
      throw new Error('Antwort unvollständig: Ein Kasus fehlt.');
    }
    return {
      key,
      values: row.values,
    };
  });
}

function normalizeBaseForms(values: Record<DeclinationGenderKey, string>): DeclinationBaseForms {
  return {
    masculine: values.masculine.trim(),
    feminine: values.feminine.trim(),
    neuter: values.neuter.trim(),
    plural: values.plural.trim(),
  };
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    const workflowAuthorized = Boolean(
      process.env.QSTASH_TOKEN
      && request.headers.get('x-eduit-workflow-token') === process.env.QSTASH_TOKEN,
    );
    if (!user && !workflowAuthorized) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const input = requestSchema.parse(await request.json());
    const adjectives = normalizeAdjectives(input.adjectives);

    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0,
      system: `You are a German grammar expert for adjective declension tables.
Return exactly four case rows (nom, akk, dat, gen) with values for masculine,
feminine, neuter, plural. Swiss spelling only (ss, never ß).`,
      prompt: `Build an adjective declension table with three forms per cell:
1) strong article pattern (definite article)
2) mixed article pattern (indefinite article)
3) weak article pattern (zero article)

Use these nouns:
- masculine: ${input.nouns.masculine}
- feminine: ${input.nouns.feminine}
- neuter: ${input.nouns.neuter}
- plural: ${input.nouns.plural}

Use these adjectives:
- masculine: ${adjectives.masculine}
- feminine: ${adjectives.feminine}
- neuter: ${adjectives.neuter}
- plural: ${adjectives.plural}

Rules:
- article, adjective, noun arrays each contain exactly 3 values.
- Keep article value empty in forms where no article is used.
- Noun entries must include correct case/plural forms.
- Keep each value plain text only, no punctuation, no pronouns, no explanations.
- Respect German grammar strictly.
`,
    });

    return Response.json({
      rows: normalizeRows(output.rows),
      baseAdjectives: normalizeBaseForms(adjectives),
      baseNouns: normalizeBaseForms(input.nouns),
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Bitte gib 4 Nomen und 1 oder 4 Adjektive ein.'
      : error instanceof Error
        ? error.message
        : 'Die Deklinationstabelle konnte nicht generiert werden.';
    return Response.json({ error: message }, { status: 400 });
  }
}
