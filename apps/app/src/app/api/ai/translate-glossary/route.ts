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

function targetLanguageLabel(code: string) {
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(code);
    return name && name !== code ? `${name} (${code})` : code;
  } catch {
    return code;
  }
}

const requestSchema = z.object({
  targetLanguage: z.string().trim().min(2).max(20),
  terms: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    definition: z.string().max(2_000),
  })).min(1).max(60),
  context: z.unknown(),
});

const resultSchema = z.object({
  translations: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    definition: z.string().max(2_000),
  })),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const input = requestSchema.parse(await request.json());
    const context = validateWorksheetPatch({ context: input.context }).context;
    const targetLanguage = input.targetLanguage;
    const targetLabel = targetLanguageLabel(targetLanguage);

    const translatableTerms = input.terms.filter(
      (term) => term.definition.trim().length > 0,
    );
    if (translatableTerms.length === 0) {
      return Response.json({ translations: [] });
    }

    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0.2,
      system: `You translate glossary definitions for language-learning
worksheets. Translate meaning faithfully and keep the wording at or below the
configured learner proficiency. Preserve any domain terminology. Return one
translation per input id and never merge, drop, or reorder entries.`,
      prompt: `Translate each glossary definition into ${targetLabel}.

Worksheet context:
${worksheetContextPrompt(context, translatableTerms.map((term) => term.definition).join(' '))}

Mandatory language proficiency:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

Rules:
- Only translate the definition text. Do not add notes, quotes, or explanations.
- Keep the translation concise and appropriate for the learner level.
- Return the exact same id for every definition you translate.
${localeSpellingInstruction(targetLanguage)}

Definitions to translate (JSON):
${JSON.stringify(translatableTerms)}`,
    });

    const translationById = new Map(
      output.translations.map((entry) => [entry.id, entry.definition]),
    );
    const translations = translatableTerms.flatMap((term) => {
      const translated = translationById.get(term.id);
      if (translated == null || translated.trim().length === 0) return [];
      return [{
        id: term.id,
        definition: normalizeLocaleSpelling(translated, targetLanguage),
      }];
    });

    return Response.json({ translations });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request.' }, { status: 400 });
    }
    return Response.json(
      { error: 'Translation failed. Please try again.' },
      { status: 500 },
    );
  }
}
