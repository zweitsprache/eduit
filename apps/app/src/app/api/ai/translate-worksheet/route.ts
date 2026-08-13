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
  languages: z.array(z.string().trim().min(2).max(20)).min(1).max(20),
  glossaryBlocks: z.array(z.object({
    position: z.number().int().min(0).max(5_000_000),
    terms: z.array(z.object({
      id: z.string().trim().min(1).max(100),
      definition: z.string().max(2_000),
      definitionTranslations: z.record(z.string(), z.string()).optional(),
    })).min(1).max(300),
  })).min(1).max(500),
  overwriteExisting: z.boolean().optional(),
  context: z.unknown(),
});

const resultSchema = z.object({
  translations: z.array(z.object({
    key: z.string().trim().min(1).max(200),
    definition: z.string().max(2_000),
  })),
});

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const input = requestSchema.parse(await request.json());
    const context = validateWorksheetPatch({ context: input.context }).context;
    const overwriteExisting = Boolean(input.overwriteExisting);
    const languageSet = [...new Set(input.languages.map((code) => code.trim()).filter(Boolean))];
    if (languageSet.length === 0) {
      return Response.json({ updates: [] });
    }

    const glossaryEntries = input.glossaryBlocks.flatMap((block) => (
      block.terms
        .filter((term) => term.definition.trim().length > 0)
        .map((term) => ({
          position: block.position,
          id: term.id,
          definition: term.definition,
          definitionTranslations: term.definitionTranslations ?? {},
        }))
    ));

    if (glossaryEntries.length === 0) {
      return Response.json({ updates: [] });
    }

    const updateMap = new Map<string, Record<string, string>>();

    for (const language of languageSet) {
      const targetLabel = targetLanguageLabel(language);
      const translatableEntries = glossaryEntries.filter((entry) => {
        if (overwriteExisting) return true;
        return !entry.definitionTranslations[language]?.trim();
      });
      if (translatableEntries.length === 0) continue;

      const payloadEntries = translatableEntries.map((entry) => ({
        key: `${entry.position}::${entry.id}`,
        definition: entry.definition,
      }));

      for (const chunk of chunkArray(payloadEntries, 60)) {
        const { output } = await generateText({
          model: educationalContentModel,
          output: Output.object({ schema: resultSchema }),
          temperature: 0.2,
          system: `You translate glossary definitions for language-learning worksheets. Translate meaning faithfully and keep wording at or below the configured learner proficiency. Preserve domain terminology. Return one translation per key and never merge, drop, or reorder entries.`,
          prompt: `Translate each glossary definition into ${targetLabel}.

Worksheet context:
${worksheetContextPrompt(context, chunk.map((entry) => entry.definition).join(' '))}

Mandatory language proficiency:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

Rules:
- Only translate the definition text. Do not add notes, quotes, or explanations.
- Keep the translation concise and appropriate for the learner level.
- Return the exact same key for every definition you translate.
${localeSpellingInstruction(language)}

Definitions to translate (JSON):
${JSON.stringify(chunk)}`,
        });

        for (const translated of output.translations) {
          const normalized = normalizeLocaleSpelling(translated.definition, language).trim();
          if (!normalized) continue;
          const previous = updateMap.get(translated.key) ?? {};
          previous[language] = normalized;
          updateMap.set(translated.key, previous);
        }
      }
    }

    const updatesByPosition = new Map<number, Map<string, Record<string, string>>>();
    for (const [key, definitionTranslations] of updateMap) {
      const separatorIndex = key.indexOf('::');
      if (separatorIndex === -1) continue;
      const position = Number(key.slice(0, separatorIndex));
      const id = key.slice(separatorIndex + 2);
      if (!Number.isFinite(position) || !id) continue;
      const positionMap = updatesByPosition.get(position) ?? new Map();
      positionMap.set(id, definitionTranslations);
      updatesByPosition.set(position, positionMap);
    }

    const updates = Array.from(updatesByPosition.entries()).map(([position, terms]) => ({
      position,
      terms: Array.from(terms.entries()).map(([id, definitionTranslations]) => ({
        id,
        definitionTranslations,
      })),
    }));

    return Response.json({ updates });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request.' }, { status: 400 });
    }
    return Response.json(
      { error: 'Worksheet translation failed. Please try again.' },
      { status: 500 },
    );
  }
}
