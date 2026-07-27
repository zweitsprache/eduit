import 'server-only';

import type { WorksheetContext } from '@/lib/worksheet-types';

const CONTENT_PRIVACY_AND_BRAND_RULES = `Mandatory privacy and brand rules:
- Never use or mention real brands, company names, commercial product names, or trademarks.
- Never include identifying personal information about a real person.
- Do not repeat personal information that may appear in the request or learner context.
- Use generic organizations, generic products, fictional people, and invented non-identifying details only.
- Use neutral placeholders where realistic identifying details would otherwise be required.`;

export function worksheetContextPrompt(context?: WorksheetContext) {
  if (!context) {
    return `No additional learner context was provided.

${CONTENT_PRIVACY_AND_BRAND_RULES}`;
  }
  const subject = context.subject === 'other'
    ? context.customSubject
    : context.subject;
  const contextText = [
    ['Curriculum subject', subject],
    ['Learner stage', context.learnerStage],
    ['Typical age range', [context.ageMin, context.ageMax]
      .filter((value) => value !== null)
      .join('–')],
    ['Content language', context.contentLanguage],
    ['Country / education system', context.country],
    ['Local level', context.localLevel],
    ['Curriculum', context.curriculum],
    ['Language proficiency', context.languageLevel],
    ['Learner context', context.learnerContext],
  ]
    .filter(([, value]) => value !== '')
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n') || 'No additional learner context was provided.';
  return `${contextText}

${CONTENT_PRIVACY_AND_BRAND_RULES}`;
}

export function usesSwissGermanOrthography(contentLanguage: string) {
  return (
    /\bde[-_ ]?ch\b/i.test(contentLanguage)
    || /(?:german|deutsch).*(?:swiss|schweiz)/i.test(contentLanguage)
    || /(?:swiss|schweiz).*(?:german|deutsch)/i.test(contentLanguage)
  );
}

export function localeSpellingInstruction(contentLanguage: string) {
  return usesSwissGermanOrthography(contentLanguage)
    ? `Use Swiss Standard German orthography.
Never use ß; always write ss.
Always use Swiss guillemets «…» for quotations. Never use straight quotes or German/English typographic double quotes.
For salutations in emails, letters, and messages, use either «Guten Tag …» for a formal or neutral register, or «Liebe …» / «Lieber …» for an informal or personal register.
Choose the closing greeting according to the register and use one of these forms only: «Freundliche Grüsse», «Viele Grüsse», «Herzliche Grüsse», or «Liebe Grüsse».`
    : 'Follow the spelling, orthography, vocabulary, and regional conventions of the specified content-language locale exactly.';
}

export function normalizeLocaleSpelling(
  value: string,
  contentLanguage: string,
) {
  if (!usesSwissGermanOrthography(contentLanguage)) return value;
  return value
    .replaceAll('ẞ', 'SS')
    .replaceAll('ß', 'ss')
    .replace(/„([^„“”\n]+)[“”]/g, '«$1»')
    .replace(/“([^“”\n]+)”/g, '«$1»')
    .replace(/"([^"\n]+)"/g, '«$1»')
    .replace(/‹([^‹›\n]+)›/g, '«$1»');
}

export function languageProficiencyInstruction(languageLevel: string) {
  const configuredLevel = languageLevel.trim();
  if (!configuredLevel) {
    return 'No language proficiency level is specified. Infer an accessible level from the learner context and avoid unnecessary complexity.';
  }

  const cefrLevel = configuredLevel.match(/\b(A1|A2|B1|B2|C1|C2)\b/i)?.[1]
    .toUpperCase();
  const cefrRules = {
    A1: `Use only very frequent, concrete everyday vocabulary.
Use very short, direct sentences with one idea per sentence.
Prefer simple present-tense statements and transparent wording.
Avoid idioms, figurative language, dense noun phrases, uncommon synonyms, and complex subordinate clauses.
Keep all information explicit and close to the wording of the fields.`,
    A2: `Use frequent, concrete everyday vocabulary appropriate to an elementary learner.
Use short, direct sentences, usually with one main idea per sentence.
Use only common connectors and simple subordinate clauses when necessary.
Avoid idioms, figurative language, dense nominal style, uncommon synonyms, specialist vocabulary, and complex nested sentences.
Keep relevant information explicit. Use only light, level-appropriate paraphrasing and a small amount of clearly understandable supporting information.`,
    B1: `Use clear standard language and familiar everyday or work-related vocabulary.
Use moderately short sentences and straightforward paragraph structure.
Simple paraphrasing and common subordinate clauses are appropriate.
Avoid highly idiomatic, abstract, technical, or syntactically dense language unless the learner context explicitly requires it.`,
    B2: `Use varied standard vocabulary and moderately complex sentence structures.
Allow natural paraphrasing and relevant abstract language while keeping the text coherent and unambiguous.
Avoid unnecessarily specialised terminology and excessive syntactic density.`,
    C1: `Use flexible, precise, and natural language with complex structures appropriate to an advanced learner.
Nuance, idiomatic phrasing, and implicit cohesion are acceptable when they support the task.`,
    C2: `Use fully natural, nuanced language appropriate to a highly proficient learner.
Complex syntax, idiomatic expression, subtle register, and dense information are acceptable.`,
  } as const;
  const rules = cefrLevel
    ? cefrRules[cefrLevel as keyof typeof cefrRules]
    : undefined;

  return `Configured language proficiency: ${configuredLevel}
Treat this level as a mandatory maximum, not a general suggestion.
${rules ?? `Adapt vocabulary, sentence structure, information density, and degree of paraphrasing strictly to the configured proficiency description.`}
Before returning the result, silently revise every learner-facing text and remove language that exceeds this level.`;
}
