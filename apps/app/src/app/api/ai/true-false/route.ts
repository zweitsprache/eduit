import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { educationalContentModel } from '@/lib/ai';
import {
  languageProficiencyInstruction,
  localeSpellingInstruction,
  normalizeLocaleSpelling,
  worksheetContextPrompt,
} from '@/lib/ai-generation';
import { validateWorksheetPatch } from '@/lib/worksheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  statementCount: z.number().int().min(2).max(15).nullable(),
  sourceText: z.string().trim().min(1).max(20_000),
  cognitiveLevel: z.enum([
    'literal',
    'paraphrase',
    'combining',
    'inference',
    'global',
  ]),
  difficultyFactors: z.object({
    plausibleDistractors: z.boolean(),
    differentWording: z.boolean(),
    includeNegation: z.boolean(),
    includeNotGiven: z.boolean(),
    scatteredAnswers: z.boolean(),
  }),
  context: z.unknown(),
});

const resultSchema = z.object({
  question: z.string().trim().min(1).max(300),
  statements: z.array(z.object({
    text: z.string().trim().min(1).max(500),
    correctValue: z.enum(['true', 'false', 'na']),
  })).min(2).max(15),
  notGivenLabel: z.string().trim().min(1).max(50),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const input = requestSchema.parse(await request.json());
    const context = validateWorksheetPatch({ context: input.context }).context;
    const contentLanguage = context?.contentLanguage ?? '';
    const countInstruction = input.statementCount === null
      ? 'Choose a sensible total between 4 and 10 statements.'
      : `Return exactly ${input.statementCount} statements.`;
    const cognitiveInstruction = {
      literal: `Literal / verbatim match: statements should repeat the source
almost word-for-word. Learners should be able to scan and match directly.`,
      paraphrase: `Paraphrase: statements must express the same information
with synonyms or changed grammatical structures. Test meaning, not word spotting.`,
      combining: `Combining information: each statement should require linking
information from at least two sentences or sections of the source.`,
      inference: `Inference: answers should be deduced from clear clues in the
source rather than copied from an explicit sentence. Do not require outside knowledge.`,
      global: `Global / evaluative: statements should concern the main idea,
author's intention, tone, purpose, or the source as a whole.`,
    }[input.cognitiveLevel];
    const factorInstructions = [
      input.difficultyFactors.plausibleDistractors
        ? 'Make false statements plausibly wrong by changing one meaningful detail.'
        : 'Make false statements clearly contradicted without subtle distractors.',
      input.difficultyFactors.differentWording
        ? 'Use wording that differs from the source wherever the cognitive level permits.'
        : 'Keep wording relatively close to the source.',
      input.difficultyFactors.includeNegation
        ? 'Include a limited number of clearly worded negative statements.'
        : 'Do not use negative constructions to create difficulty.',
      input.difficultyFactors.scatteredAnswers
        ? 'Distribute tested information across the source, including details away from the beginning.'
        : 'Prefer information that is straightforward to locate.',
      input.difficultyFactors.includeNotGiven
        ? `Use true, false, and not-given answers. "False" means contradicted by
the source; "na" means neither stated nor contradicted. Include at least one of
each answer type.`
        : `Use only true and false answers. Never return "na".`,
    ].join('\n- ');

    const sourceInstruction = `Use the source text below as the sole factual basis.
Every true statement must be directly supported by the source.
Every false statement must clearly contradict a specific source detail while
remaining plausible. Do not test information absent from the source.

SOURCE TEXT:
${input.sourceText}`;

    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0.35,
      system: `You create rigorous educational true-or-false activities.
The configured language proficiency is a mandatory maximum difficulty.
Statements must be unambiguous, factual, and assess meaningful comprehension.`,
      prompt: `Create a true-or-false activity.

${countInstruction}

Worksheet context:
${worksheetContextPrompt(context, [
  input.sourceText,
  input.cognitiveLevel,
].join(' '))}

Mandatory language proficiency:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

${sourceInstruction}

Cognitive-processing level:
${cognitiveInstruction}

Additional difficulty requirements:
- ${factorInstructions}

Didactic requirements:
- Write one concise learner-facing question or prompt for the source activity.
- Use a balanced mixture of true and false statements. Neither answer may
  account for more than two thirds of the statements.
- Avoid trick questions, double negatives, vague quantifiers, and opinions.
- Test meaningful details and relationships, not trivial wording differences.
- Make false statements wrong for one clear reason.
- Keep each statement within the configured language level.
- Do not reveal the answer in the wording or add explanations.
- Return correctValue as exactly "true", "false", or "na".
- Return a concise content-language label for the not-given option in
  notGivenLabel, even when that option is disabled.

Use the requested content language.
${localeSpellingInstruction(contentLanguage)}`,
    });

    if (
      input.statementCount !== null
        ? output.statements.length !== input.statementCount
        : output.statements.length < 4 || output.statements.length > 10
    ) {
      throw new Error('The model returned an unexpected number of statements.');
    }

    const trueCount = output.statements.filter(
      ({ correctValue }) => correctValue === 'true',
    ).length;
    const naCount = output.statements.filter(
      ({ correctValue }) => correctValue === 'na',
    ).length;
    const actualFalseCount = output.statements.filter(
      ({ correctValue }) => correctValue === 'false',
    ).length;
    const maximumAnswerCount = Math.ceil(output.statements.length * 2 / 3);
    if (input.difficultyFactors.includeNotGiven
      ? trueCount === 0 || actualFalseCount === 0 || naCount === 0
      : trueCount === 0
        || actualFalseCount === 0
        || naCount > 0
        || trueCount > maximumAnswerCount
        || actualFalseCount > maximumAnswerCount
    ) {
      throw new Error('The model returned an unbalanced answer set.');
    }

    return Response.json({
      question: normalizeLocaleSpelling(output.question, contentLanguage),
      includeNotGiven: input.difficultyFactors.includeNotGiven,
      notGivenLabel: normalizeLocaleSpelling(
        output.notGivenLabel,
        contentLanguage,
      ),
      rows: output.statements.map((statement) => ({
        text: normalizeLocaleSpelling(statement.text, contentLanguage),
        correctValue: statement.correctValue,
      })),
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Check the topic and statement settings.'
      : error instanceof Error
        ? error.message
        : 'True-or-false generation failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
