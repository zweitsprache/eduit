import { generateText, Output } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { occupationAutomationModel } from '@/lib/ai';
import { EMPTY_WORKSHEET_CONTEXT } from '@/lib/worksheet-types';
import { worksheetPatchFromGeneratedJson } from '@/lib/worksheet-json-import';
import { createWorksheet } from '@/lib/worksheets';
import sampleA12 from '../../../../../public/samples/a1-2.json';
import sampleA22 from '../../../../../public/samples/a2-2.json';
import sampleB12 from '../../../../../public/samples/b1-2.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET_LEVELS = ['A1.2', 'A2.2', 'B1.2'] as const;
type TargetLevel = (typeof TARGET_LEVELS)[number];

const MAX_READING_CHARACTERS: Record<TargetLevel, number> = {
  'A1.2': 1216,
  'A2.2': 1285,
  'B1.2': 2320,
};

const SAMPLE_WORKSHEET_JSON: Record<TargetLevel, unknown> = {
  'A1.2': sampleA12,
  'A2.2': sampleA22,
  'B1.2': sampleB12,
};

function loadBerufsberatungSamplePrompt() {
  const fallback = JSON.stringify({
    schemaVersion: 1,
    worksheets: [sampleA12.worksheets?.[0], sampleA22.worksheets?.[0], sampleB12.worksheets?.[0]].filter(Boolean),
  });
  const candidatePaths = [
    path.resolve(process.cwd(), 'public/samples/berusfsberatung.json'),
    path.resolve(process.cwd(), '../../apps/app/public/samples/berusfsberatung.json'),
  ];
  for (const filePath of candidatePaths) {
    try {
      const content = readFileSync(filePath, 'utf8').trim();
      if (content.length > 0) return content;
    } catch {
      // Fall back to the composed sample payload when file lookup fails.
    }
  }
  return fallback;
}

const BERUFSBERATUNG_SAMPLE_PROMPT = loadBerufsberatungSamplePrompt();

const requestSchema = z.object({
  urls: z.array(z.string().trim().url()).min(1).max(20),
  brandProfileId: z.string().uuid(),
});

const glossaryEntrySchema = z.object({
  term: z.string().trim().min(1).max(200),
  definition: z.string().trim().min(1).max(400),
});

const optionSchema = z.object({
  text: z.string().trim().min(1).max(400),
  correct: z.boolean(),
});

const mcqQuestionSchema = z.object({
  question: z.string().trim().min(1).max(500),
  options: z.array(optionSchema).min(3).max(4),
}).superRefine((value, ctx) => {
  const correctCount = value.options.filter(({ correct }) => correct).length;
  if (correctCount !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Each MCQ must have exactly one correct option.',
      path: ['options'],
    });
  }
  const normalized = value.options.map(({ text }) => (
    text.toLocaleLowerCase('de-CH').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  ));
  if (new Set(normalized).size !== normalized.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'MCQ options must be distinct.',
      path: ['options'],
    });
  }
});

const a12ResultSchema = z.object({
  title: z.string().trim().min(3).max(140),
  readingHtml: z.string().trim().min(50).max(12000),
  trueFalseRows: z.array(z.object({
    text: z.string().trim().min(1).max(300),
    correctValue: z.enum(['true', 'false']),
  })).length(5),
  glossary: z.array(glossaryEntrySchema).min(14).max(24),
});

const a22ResultSchema = z.object({
  title: z.string().trim().min(3).max(140),
  readingHtml: z.string().trim().min(50).max(12000),
  mcqs: z.array(mcqQuestionSchema).length(3).superRefine((questions, ctx) => {
    for (const question of questions) {
      if (question.options.length !== 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A2.2 MCQs must contain exactly 3 options each.',
        });
      }
    }
  }),
  glossary: z.array(glossaryEntrySchema).min(14).max(24),
});

const b12ResultSchema = z.object({
  title: z.string().trim().min(3).max(140),
  readingHtml: z.string().trim().min(50).max(16000),
  mcqs: z.array(mcqQuestionSchema).length(3).superRefine((questions, ctx) => {
    for (const question of questions) {
      if (question.options.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'B1.2 MCQs must contain exactly 4 options each.',
        });
      }
    }
  }),
  glossary: z.array(glossaryEntrySchema).min(15).max(26),
});

const shortenReadingSchema = z.object({
  readingHtml: z.string().trim().min(20).max(12000),
});

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function sourceText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  ).slice(0, 35_000);
}

function textLengthFromHtml(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  ).length;
}

function ensureCitation(readingHtml: string) {
  const hasCitation = /quelle\s*:\s*berufsberatung\.ch/i.test(readingHtml);
  if (hasCitation) return readingHtml;
  return `${readingHtml}<p>Quelle: berufsberatung.ch</p>`;
}

function stripCitation(readingHtml: string) {
  return readingHtml
    .replace(/<p>\s*Quelle\s*:\s*berufsberatung\.ch\s*<\/p>/gi, '')
    .trim();
}

function normalizeOfficialOccupationUrl(raw: string) {
  const parsed = new URL(raw);
  if (parsed.hostname !== 'www.berufsberatung.ch') {
    throw new Error(`Only www.berufsberatung.ch URLs are supported: ${raw}`);
  }
  if (!parsed.pathname.startsWith('/de/berufe/')) {
    throw new Error(`URL must point to a DE occupation profile under /de/berufe/: ${raw}`);
  }
  parsed.hash = '';
  parsed.search = '';
  return parsed.toString();
}

function extractTitleFromHtml(html: string, fallbackUrl: string) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '';
  const cleaned = decodeHtmlEntities(h1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  if (cleaned.length >= 3) return cleaned.slice(0, 140);
  const slug = decodeURIComponent(new URL(fallbackUrl).pathname.split('/').at(-1) ?? 'Berufsprofil');
  return slug.replace(/[-_]+/g, ' ').trim().slice(0, 140) || 'Berufsprofil';
}

function scientificMcqRequirements() {
  return `Scientific-quality MCQ requirements (mandatory):
- Every question must test one clearly defined construct from the reading.
- Exactly one option is correct and defensible from the source text.
- Distractors must be plausible misconceptions based on the same source, not random falsehoods.
- Options must be parallel in grammar, semantic type, and approximate length.
- Options must be mutually exclusive and non-overlapping.
- Avoid cueing: no absolute terms used only in distractors, no «all/none of the above», no obviously longer key.
- Avoid negation traps (NOT/EXCEPT) and trick questions.
- Keep wording level-appropriate and free of ambiguity.
- Questions must be answerable only with the reading text, not outside knowledge.`;
}

function plainText(value: string) {
  return decodeHtmlEntities(
    value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  );
}

function sampleWorksheet(level: TargetLevel) {
  const raw = SAMPLE_WORKSHEET_JSON[level] as {
    worksheets?: Array<{
      blocks?: Array<Record<string, unknown>>;
    }>;
  };
  return raw.worksheets?.[0] ?? { blocks: [] };
}

function sampleReadingExcerpt(level: TargetLevel) {
  const blocks = sampleWorksheet(level).blocks ?? [];
  const richTextHtml = blocks.find((block) => block.type === 'richText')?.html;
  if (typeof richTextHtml !== 'string') return '';
  return plainText(richTextHtml).slice(0, 1200);
}

function sampleStructureSummary(level: TargetLevel) {
  const blocks = sampleWorksheet(level).blocks ?? [];
  const summary = blocks.map((block) => {
    const type = typeof block.type === 'string' ? block.type : 'unknown';
    if (type === 'mcq') {
      const questions = Array.isArray(block.questions) ? block.questions : [];
      const optionCounts = questions.map((question) => (
        Array.isArray((question as { options?: unknown[] }).options)
          ? ((question as { options: unknown[] }).options).length
          : 0
      ));
      return { type, questionCount: questions.length, optionCounts };
    }
    if (type === 'trueFalse') {
      const rows = Array.isArray(block.rows) ? block.rows : [];
      return { type, rowCount: rows.length };
    }
    if (type === 'glossary') {
      const entries = Array.isArray(block.entries) ? block.entries : [];
      return { type, entryCount: entries.length };
    }
    return { type };
  });
  return JSON.stringify(summary);
}

function sourceFactsForAttempt(sourceFacts: string, attempt: number) {
  const limits = [18_000, 12_000, 8_000];
  return sourceFacts.slice(0, limits[Math.min(attempt, limits.length - 1)]);
}

function berufsberatungSampleForAttempt(attempt: number) {
  if (attempt === 0) return BERUFSBERATUNG_SAMPLE_PROMPT;
  if (attempt === 1) return BERUFSBERATUNG_SAMPLE_PROMPT.slice(0, 30_000);
  return BERUFSBERATUNG_SAMPLE_PROMPT.slice(0, 16_000);
}

async function enforceReadingBodyLength(
  bodyHtml: string,
  level: TargetLevel,
  maxChars: number,
) {
  const currentBody = stripCitation(bodyHtml);
  if (textLengthFromHtml(currentBody) <= maxChars) return currentBody;

  let candidate = currentBody;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { output } = await generateText({
        model: occupationAutomationModel,
        output: Output.object({ schema: shortenReadingSchema }),
        temperature: 0.2,
        system: `You rewrite German learner reading texts while preserving facts and level.
Return ONLY a JSON object that matches the schema exactly.`,
        prompt: `Shorten the following reading text for level ${level}.

Constraints:
- Keep all factual claims grounded in the text.
- Keep the level exactly at ${level}.
- Keep text style natural and learner-facing, not encyclopedic.
- Return HTML with only <p>, <strong>, and <br>.
- Do not include the source line.
- Maximum plain-text length: ${maxChars} characters.

INPUT HTML:
${candidate}`,
      });
      candidate = stripCitation(output.readingHtml);
      if (textLengthFromHtml(candidate) <= maxChars) return candidate;
    } catch (error) {
      lastError = error;
    }
  }

  if (textLengthFromHtml(candidate) <= maxChars) return candidate;
  throw lastError instanceof Error
    ? lastError
    : new Error(`Generated ${level} reading text exceeds maximum sample length.`);
}

async function generateA12Worksheet(args: { sourceTitle: string; sourceFacts: string; sourceUrl: string; }) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { output } = await generateText({
        model: occupationAutomationModel,
        output: Output.object({ schema: a12ResultSchema }),
        temperature: 0.25,
        system: `You create German A1.2 reading worksheets for adult DaZ learners.
Use only facts from the source content. Never invent facts.
Return ONLY a JSON object that matches the schema exactly. No markdown, no prose outside JSON.`,
        prompt: `Ich brauche das fuer einen neuen Beruf in diesem JSON-Format:

      ${berufsberatungSampleForAttempt(attempt)}

      Neue Quelle:
      - URL: ${args.sourceUrl}
      - Berufstitel: ${args.sourceTitle}

      Quelltext (nur diese Fakten verwenden):
      ${sourceFactsForAttempt(args.sourceFacts, attempt)}

      Erzeuge genau ein neues Arbeitsblatt fuer Niveau A1.2.

      Pflichtregeln:
      - Ausgabe nur als JSON-Objekt gemaess Schema.
      - Sprache: Deutsch (Schweizer Rechtschreibung, ss statt sscharf).
      - Lesetext max. ${MAX_READING_CHARACTERS['A1.2']} Zeichen (Plain Text), HTML nur mit <p>, <strong>, <br>.
      - Keine Quellenzeile im Lesetext; die Quelle wird spaeter automatisch eingefuegt.
      - trueFalse: genau 5 Aussagen, mindestens 2 richtig und 2 falsch, alles direkt aus Quelltext belegbar.
      - glossary: 16 bis 20 Eintraege, einfach und lernendenfreundlich.
      - Stil und Blockstruktur am Beispiel ausrichten, aber keine Saetze kopieren.`,
      });
      return output;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('A1.2 worksheet generation failed.');
}

async function generateA22Worksheet(args: { sourceTitle: string; sourceFacts: string; sourceUrl: string; }) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { output } = await generateText({
        model: occupationAutomationModel,
        output: Output.object({ schema: a22ResultSchema }),
        temperature: 0.25,
        system: `You create German A2.2 reading worksheets for adult DaZ learners.
Use only facts from the source content. Never invent facts.
Return ONLY a JSON object that matches the schema exactly. No markdown, no prose outside JSON.`,
        prompt: `Ich brauche das fuer einen neuen Beruf in diesem JSON-Format:

${berufsberatungSampleForAttempt(attempt)}

Neue Quelle:
- URL: ${args.sourceUrl}
- Berufstitel: ${args.sourceTitle}

Quelltext (nur diese Fakten verwenden):
${sourceFactsForAttempt(args.sourceFacts, attempt)}

Erzeuge genau ein neues Arbeitsblatt fuer Niveau A2.2.

Pflichtregeln:
- Ausgabe nur als JSON-Objekt gemaess Schema.
- Sprache: Deutsch (Schweizer Rechtschreibung, ss statt sscharf).
- Lesetext max. ${MAX_READING_CHARACTERS['A2.2']} Zeichen (Plain Text), HTML nur mit <p>, <strong>, <br>.
- Keine Quellenzeile im Lesetext; die Quelle wird spaeter automatisch eingefuegt.
- mcqs: genau 3 Fragen, pro Frage genau 3 Optionen, genau 1 richtige Option.
- Alle MCQs muessen direkt mit dem Lesetext loesbar sein.
- glossary: 16 bis 20 Eintraege, klar und niveaugerecht.
- Stil und Blockstruktur am Beispiel ausrichten, aber keine Saetze kopieren.

${scientificMcqRequirements()}`,
      });
      return output;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('A2.2 worksheet generation failed.');
}

async function generateB12Worksheet(args: { sourceTitle: string; sourceFacts: string; sourceUrl: string; }) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { output } = await generateText({
        model: occupationAutomationModel,
        output: Output.object({ schema: b12ResultSchema }),
        temperature: 0.25,
        system: `You create German B1.2 reading worksheets for adult DaZ learners.
Use only facts from the source content. Never invent facts.
Return ONLY a JSON object that matches the schema exactly. No markdown, no prose outside JSON.`,
        prompt: `Ich brauche das fuer einen neuen Beruf in diesem JSON-Format:

${berufsberatungSampleForAttempt(attempt)}

Neue Quelle:
- URL: ${args.sourceUrl}
- Berufstitel: ${args.sourceTitle}

Quelltext (nur diese Fakten verwenden):
${sourceFactsForAttempt(args.sourceFacts, attempt)}

Erzeuge genau ein neues Arbeitsblatt fuer Niveau B1.2.

Pflichtregeln:
- Ausgabe nur als JSON-Objekt gemaess Schema.
- Sprache: Deutsch (Schweizer Rechtschreibung, ss statt sscharf).
- Lesetext max. ${MAX_READING_CHARACTERS['B1.2']} Zeichen (Plain Text), HTML nur mit <p>, <strong>, <br>.
- Keine Quellenzeile im Lesetext; die Quelle wird spaeter automatisch eingefuegt.
- mcqs: genau 3 Fragen, pro Frage genau 4 Optionen, genau 1 richtige Option.
- Alle MCQs muessen direkt mit dem Lesetext loesbar sein.
- glossary: 16 bis 22 Eintraege, praezise und niveaugerecht.
- Stil und Blockstruktur am Beispiel ausrichten, aber keine Saetze kopieren.

${scientificMcqRequirements()}`,
      });
      return output;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('B1.2 worksheet generation failed.');
}

async function buildLevelWorksheet(
  level: TargetLevel,
  sourceTitle: string,
  sourceFacts: string,
  sourceUrl: string,
) {
  if (level === 'A1.2') {
    const generated = await generateA12Worksheet({ sourceTitle, sourceFacts, sourceUrl });
    const readingBodyHtml = await enforceReadingBodyLength(
      generated.readingHtml,
      level,
      MAX_READING_CHARACTERS[level],
    );
    const readingHtml = ensureCitation(readingBodyHtml);
    return {
      title: generated.title,
      blocks: [
        {
          type: 'heading',
          text: generated.title,
          level: 1,
          numbered: false,
          gapAfter: 2,
          restartInstructionNumbering: true,
        },
        { type: 'richText', html: readingHtml },
        {
          type: 'trueFalse',
          instruction: 'Sind diese Aussagen richtig oder falsch? Kreuzen Sie an.',
          question: '',
          trueLabel: 'Richtig',
          falseLabel: 'Falsch',
          showNa: false,
          naLabel: 'N/A',
          showFirstAsExample: false,
          rows: generated.trueFalseRows,
        },
        { type: 'pageBreak', restartPagination: false },
        {
          type: 'heading',
          text: generated.title,
          level: 1,
          numbered: false,
          gapAfter: 2,
          restartInstructionNumbering: true,
        },
        {
          type: 'glossary',
          preset: 'default',
          showInstruction: false,
          showColumnHeaders: true,
          showExample: false,
          showAdditionalColumn: false,
          headerLabels: [],
          termWidth: 33,
          definitionWidth: 33,
          additionalWidth: 20,
          entries: generated.glossary,
        },
      ],
    };
  }

  if (level === 'A2.2') {
    const generated = await generateA22Worksheet({ sourceTitle, sourceFacts, sourceUrl });
    const readingBodyHtml = await enforceReadingBodyLength(
      generated.readingHtml,
      level,
      MAX_READING_CHARACTERS[level],
    );
    const readingHtml = ensureCitation(readingBodyHtml);
    return {
      title: generated.title,
      blocks: [
        {
          type: 'heading',
          text: generated.title,
          level: 1,
          numbered: false,
          gapAfter: 2,
          restartInstructionNumbering: true,
        },
        { type: 'richText', html: readingHtml },
        ...generated.mcqs.map((question) => ({
          type: 'mcq' as const,
          instruction: 'Choose the correct answer.',
          blockQuestion: '\n',
          columns: 1,
          shuffleAnswers: false,
          showInstruction: true,
          questions: [{
            question: question.question,
            answerMode: 'single' as const,
            options: question.options,
          }],
        })),
        { type: 'pageBreak', restartPagination: false },
        {
          type: 'heading',
          text: generated.title,
          level: 1,
          numbered: false,
          gapAfter: 2,
          restartInstructionNumbering: true,
        },
        {
          type: 'glossary',
          preset: 'default',
          showInstruction: false,
          showColumnHeaders: true,
          showExample: false,
          showAdditionalColumn: false,
          headerLabels: [],
          termWidth: 33,
          definitionWidth: 33,
          additionalWidth: 20,
          entries: generated.glossary,
        },
      ],
    };
  }

  const generated = await generateB12Worksheet({ sourceTitle, sourceFacts, sourceUrl });
  const readingBodyHtml = await enforceReadingBodyLength(
    generated.readingHtml,
    level,
    MAX_READING_CHARACTERS[level],
  );
  const readingHtml = ensureCitation(readingBodyHtml);
  return {
    title: generated.title,
    blocks: [
      {
        type: 'heading',
        text: generated.title,
        level: 1,
        numbered: false,
        gapAfter: 2,
        restartInstructionNumbering: true,
      },
      { type: 'richText', html: readingHtml },
      { type: 'pageBreak', restartPagination: false },
      {
        type: 'heading',
        text: generated.title,
        level: 1,
        numbered: false,
        gapAfter: 2,
        restartInstructionNumbering: true,
      },
      ...generated.mcqs.map((question) => ({
        type: 'mcq' as const,
        instruction: 'Choose the correct answer.',
        blockQuestion: '',
        columns: 1,
        shuffleAnswers: false,
        showInstruction: true,
        questions: [{
          question: question.question,
          answerMode: 'single' as const,
          options: question.options,
        }],
      })),
      { type: 'pageBreak', restartPagination: false },
      {
        type: 'heading',
        text: generated.title,
        level: 1,
        numbered: false,
        gapAfter: 2,
        restartInstructionNumbering: true,
      },
      {
        type: 'glossary',
        preset: 'default',
        showInstruction: false,
        showColumnHeaders: true,
        showExample: false,
        showAdditionalColumn: false,
        headerLabels: [],
        termWidth: 33,
        definitionWidth: 33,
        additionalWidth: 20,
        entries: generated.glossary,
      },
    ],
  };
}

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const input = requestSchema.parse(await request.json());
    const urls = [...new Set(input.urls.map(normalizeOfficialOccupationUrl))];
    const worksheets: Array<{
      id: string;
      title: string;
      level: TargetLevel;
      sourceUrl: string;
    }> = [];
    const failures: Array<{ sourceUrl: string; error: string }> = [];

    for (const sourceUrl of urls) {
      try {
        const html = await fetch(sourceUrl, { cache: 'no-store' }).then((response) => {
          if (!response.ok) throw new Error(`Source page could not be fetched (${response.status}).`);
          return response.text();
        });
        const sourceFacts = sourceText(html);
        if (sourceFacts.length < 200) {
          throw new Error('Source page does not contain enough readable text content.');
        }
        const sourceTitle = extractTitleFromHtml(html, sourceUrl);

        for (const level of TARGET_LEVELS) {
          const generated = await buildLevelWorksheet(level, sourceTitle, sourceFacts, sourceUrl);
          const worksheetPatch = worksheetPatchFromGeneratedJson({
            title: `${generated.title} (${level})`,
            documentSize: 'a4-portrait',
            showSolutions: false,
            status: 'draft',
            brandProfileId: input.brandProfileId,
            context: {
              ...EMPTY_WORKSHEET_CONTEXT,
              worksheetLanguage: 'de-formal',
              subject: 'Deutsch',
              learnerStage: 'adult-education',
              contentLanguage: 'German',
              languageLevel: level,
            },
            blocks: generated.blocks,
          }, input.brandProfileId);
          const worksheet = await createWorksheet(user.id, worksheetPatch);
          if (!worksheet) throw new Error('Worksheet could not be created.');
          worksheets.push({ id: worksheet.id, title: worksheet.title, level, sourceUrl });
        }
      } catch (error) {
        failures.push({
          sourceUrl,
          error: error instanceof Error ? error.message : 'Automation failed.',
        });
      }
    }

    return Response.json({
      worksheets,
      failures,
      totalUrls: urls.length,
    }, { status: 201 });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Automation failed.',
    }, { status: 400 });
  }
}
