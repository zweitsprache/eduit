import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { verbGenerationModel } from '@/lib/ai';
import {
  GERMAN_REFLEXIVE_PRONOUNS,
  isGermanOptionalReflexiveInfinitive,
  isGermanReflexiveInfinitive,
} from '@/lib/german-verb-forms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  infinitive: z.string().trim().min(2).max(80),
  tense: z.enum([
    'present', 'preterite', 'perfect', 'pluperfect', 'future-one', 'future-two',
  ]).default('present'),
  mood: z.enum([
    'indicative', 'subjunctive-one', 'subjunctive-two',
  ]).default('indicative'),
});

const formsSchema = z.object({
  ich: z.string().trim().min(1).max(80),
  du: z.string().trim().min(1).max(80),
  formalSingular: z.string().trim().min(1).max(80),
  thirdSingular: z.string().trim().min(1).max(80),
  wir: z.string().trim().min(1).max(80),
  ihr: z.string().trim().min(1).max(80),
  formalPlural: z.string().trim().min(1).max(80),
  thirdPlural: z.string().trim().min(1).max(80),
  preteriteIch: z.string().trim().min(1).max(80),
});

const resultSchema = z.object({
  forms: formsSchema,
  auxiliary: z.enum(['sein', 'haben']),
  participle: z.string().trim().min(1).max(80),
  describesMovement: z.boolean(),
  separablePrefix: z.string().trim().max(30).nullable(),
});

function swissSpelling(value: string) {
  return value.replaceAll('ß', 'ss');
}

function normalizeSeparableForm(value: string, prefix: string) {
  const normalizedValue = swissSpelling(value).trim();
  const normalizedPrefix = swissSpelling(prefix).trim();
  if (!normalizedPrefix) return normalizedValue;
  if (
    !normalizedValue
      .toLocaleLowerCase('de-DE')
      .endsWith(normalizedPrefix.toLocaleLowerCase('de-DE'))
  ) {
    return normalizedValue;
  }
  const base = normalizedValue
    .slice(0, -normalizedPrefix.length)
    .trimEnd();
  return `${base} ${normalizedPrefix}`;
}

function parenthesizeOptionalReflexivePronoun(
  value: string,
  key: keyof typeof GERMAN_REFLEXIVE_PRONOUNS,
) {
  const pronoun = GERMAN_REFLEXIVE_PRONOUNS[key];
  return value.replace(
    new RegExp(`(?:\\(${pronoun}\\)|\\b${pronoun}\\b)`, 'i'),
    `(${pronoun})`,
  );
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
    const infinitive = swissSpelling(
      input.infinitive.toLocaleLowerCase('de-DE'),
    );
    const tenseLabel = ({
      present: 'Präsens',
      preterite: 'Präteritum',
      perfect: 'Perfekt',
      pluperfect: 'Plusquamperfekt',
      'future-one': 'Futur I',
      'future-two': 'Futur II',
    } as const)[input.tense];
    const { output } = await generateText({
      model: verbGenerationModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0,
      system: `You are a German morphology expert. Return correct standard
German verb forms with Swiss spelling (always ss, never ß). Distinguish
separable, inseparable, reflexive, modal, mixed, strong, weak, and irregular
verbs accurately. Return verb forms only, without pronouns or explanations.`,
      prompt: `Conjugate this German infinitive: ${infinitive}

Return:
- ${{
    indicative: 'Indikativ',
    'subjunctive-one': 'Konjunktiv I',
    'subjunctive-two': 'Konjunktiv II',
  }[input.mood]} ${tenseLabel} for ich, du,
  formal singular Sie, er/sie/es, wir, ihr, formal plural Sie, and
  third-person plural sie in the eight main form fields.
- Präteritum for ich.
- The correct Perfekt auxiliary as the infinitive "sein" or "haben".
- Partizip II without an auxiliary.
- describesMovement: true only when the verb literally describes directed
  movement or a change of location. Being, remaining, changing state, and
  exceptional sein-verbs that do not describe movement must return false.
- separablePrefix: the detachable prefix without spaces when this is a
  separable verb, otherwise null.

Mandatory:
- For separable verbs, use standard German word order for the requested tense.
  In simple finite Präsens and Präteritum place the prefix last, for example
  "fahre ab". In compound tenses use the correct Partizip II placement.
  Always return "ab" as separablePrefix.
- Never classify an inseparable prefix as separable.
- For reflexive verbs, include the reflexive pronoun belonging to the person.
- When the infinitive marks an optionally reflexive verb as "(sich)", retain
  the parentheses around each corresponding reflexive pronoun, for example
  "freue (mich)", "freust (dich)", and "freut (sich)".
- Use lowercase except formal "Sie" is represented only by the requested form,
  so do not include any subject pronoun.
- Use Swiss orthography: replace every ß with ss.
- Do not regularize an irregular verb.`,
    });

    const separablePrefix = swissSpelling(output.separablePrefix ?? '');
    const optionalReflexive = isGermanOptionalReflexiveInfinitive(infinitive);
    const reflexiveMarker = optionalReflexive
      ? '(sich)'
      : isGermanReflexiveInfinitive(infinitive)
        ? 'sich'
        : '';
    const prefixForMetadata = separablePrefix || reflexiveMarker;
    const forms = Object.fromEntries(
      Object.entries(output.forms).map(([key, value]) => {
        const reflexiveKey = key === 'preteriteIch' ? 'ich' : key;
        return [
          key,
          optionalReflexive
            ? parenthesizeOptionalReflexivePronoun(
              normalizeSeparableForm(value, separablePrefix),
              reflexiveKey as keyof typeof GERMAN_REFLEXIVE_PRONOUNS,
            )
            : normalizeSeparableForm(value, separablePrefix),
        ];
      }),
    );

    return Response.json({
      infinitive,
      forms,
      auxiliary: output.auxiliary,
      participle: swissSpelling(output.participle),
      comparisonAuxiliary: output.describesMovement ? 'sein' : 'haben',
      separablePrefix: prefixForMetadata,
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Enter a valid German infinitive.'
      : error instanceof Error
        ? error.message
        : 'Verb generation failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
