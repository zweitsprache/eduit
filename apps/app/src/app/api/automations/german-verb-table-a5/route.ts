import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { createWorksheet } from '@/lib/worksheets';
import { sql } from '@/lib/neon';
import { EMPTY_WORKSHEET_CONTEXT } from '@/lib/worksheet-types';
import { worksheetPatchFromGeneratedJson } from '@/lib/worksheet-json-import';

type GermanVerbTableForms = {
  ich: string;
  du: string;
  formalSingular: string;
  thirdSingular: string;
  wir: string;
  ihr: string;
  formalPlural: string;
  thirdPlural: string;
  preteriteIch: string;
};

type GeneratedVerb = {
  infinitive: string;
  forms: GermanVerbTableForms;
  auxiliary: 'sein' | 'haben';
  participle: string;
  comparisonAuxiliary: 'sein' | 'haben';
  separablePrefix: string;
  error?: string;
};

const requestSchema = z.object({
  infinitives: z.array(z.string().trim().min(2).max(80)).min(1).max(200),
  brandProfileId: z.string().uuid(),
  headingText: z.string().trim().min(1).max(120).default('Indikativ Präsens'),
  tense: z.enum(['present', 'preterite']).default('present'),
  worksheetLanguage: z.enum(['en', 'de-formal', 'de-informal']).default('en'),
  context: z.record(z.string(), z.unknown()).optional(),
});

const HABEN_FORMS: GermanVerbTableForms = {
  ich: 'habe',
  du: 'hast',
  formalSingular: 'haben',
  thirdSingular: 'hat',
  wir: 'haben',
  ihr: 'habt',
  formalPlural: 'haben',
  thirdPlural: 'haben',
  preteriteIch: 'hatte',
};

const DEFAULT_MULTIPLE_VERBS = [
  {
    verb: 'sein',
    forms: {
      ich: 'bin',
      du: 'bist',
      formalSingular: 'sind',
      thirdSingular: 'ist',
      wir: 'sind',
      ihr: 'seid',
      formalPlural: 'sind',
      thirdPlural: 'sind',
      preteriteIch: 'war',
    },
    separablePrefix: '',
  },
  {
    verb: 'haben',
    forms: {
      ich: 'habe',
      du: 'hast',
      formalSingular: 'haben',
      thirdSingular: 'hat',
      wir: 'haben',
      ihr: 'habt',
      formalPlural: 'haben',
      thirdPlural: 'haben',
      preteriteIch: 'hatte',
    },
    separablePrefix: '',
  },
  {
    verb: 'abfahren',
    forms: {
      ich: 'fahre ab',
      du: 'fährst ab',
      formalSingular: 'fahren ab',
      thirdSingular: 'fährt ab',
      wir: 'fahren ab',
      ihr: 'fahrt ab',
      formalPlural: 'fahren ab',
      thirdPlural: 'fahren ab',
      preteriteIch: 'fuhr ab',
    },
    separablePrefix: 'ab',
  },
  {
    verb: 'einkaufen',
    forms: {
      ich: 'kaufe ein',
      du: 'kaufst ein',
      formalSingular: 'kaufen ein',
      thirdSingular: 'kauft ein',
      wir: 'kaufen ein',
      ihr: 'kauft ein',
      formalPlural: 'kaufen ein',
      thirdPlural: 'kaufen ein',
      preteriteIch: 'kaufte ein',
    },
    separablePrefix: 'ein',
  },
  {
    verb: 'gehen',
    forms: {
      ich: 'gehe',
      du: 'gehst',
      formalSingular: 'gehen',
      thirdSingular: 'geht',
      wir: 'gehen',
      ihr: 'geht',
      formalPlural: 'gehen',
      thirdPlural: 'gehen',
      preteriteIch: 'ging',
    },
    separablePrefix: '',
  },
] as const;

async function generateVerb(args: {
  origin: string;
  cookie: string;
  infinitive: string;
  tense: 'present' | 'preterite';
}) {
  const response = await fetch(`${args.origin}/api/ai/german-verb-table`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: args.cookie,
    },
    body: JSON.stringify({
      infinitive: args.infinitive,
      tense: args.tense,
      mood: 'indicative',
    }),
  });
  const result = await response.json().catch(() => ({})) as GeneratedVerb;
  if (!response.ok || !result.infinitive || !result.forms || !result.auxiliary || !result.participle || !result.comparisonAuxiliary) {
    throw new Error(result.error ?? `AI generation failed for ${args.infinitive}.`);
  }
  return result;
}

function isDocumentSizeConstraintError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /worksheets_document_size_check|document_size/i.test(error.message);
}

async function ensureA5DocumentSizeConstraint() {
  await sql`
    alter table worksheets
      drop constraint if exists worksheets_document_size_check
  `;
  await sql`
    alter table worksheets
      add constraint worksheets_document_size_check check (
        document_size in (
          'a4-portrait',
          'a4-landscape',
          'a5-landscape',
          'letter-portrait',
          'letter-landscape'
        )
      )
  `;
}

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  try {
    const input = requestSchema.parse(await request.json());
    const contextInput = input.context ?? {};
    const baseContext = {
      ...EMPTY_WORKSHEET_CONTEXT,
      ...contextInput,
      worksheetType: 'verb-table' as const,
      worksheetLanguage: typeof contextInput.worksheetLanguage === 'string'
        ? contextInput.worksheetLanguage
        : input.worksheetLanguage,
    };
    const normalizedInfinitives = [
      ...new Set(input.infinitives.map((value) => value.toLocaleLowerCase('de-DE').trim())),
    ];
    const origin = new URL(request.url).origin;
    const cookie = request.headers.get('cookie') ?? '';

    const worksheets: Array<{ id: string; title: string }> = [];
    const failures: Array<{ infinitive: string; error: string }> = [];
    let triedConstraintRepair = false;

    for (let index = 0; index < normalizedInfinitives.length; index += 5) {
      const chunk = normalizedInfinitives.slice(index, index + 5);
      const generatedChunk = await Promise.allSettled(
        chunk.map((infinitive) => generateVerb({
          origin,
          cookie,
          infinitive,
          tense: input.tense,
        })),
      );

      for (let chunkIndex = 0; chunkIndex < generatedChunk.length; chunkIndex += 1) {
        const result = generatedChunk[chunkIndex];
        const infinitive = chunk[chunkIndex];

        if (result.status === 'rejected') {
          failures.push({
            infinitive,
            error: result.reason instanceof Error ? result.reason.message : 'AI generation failed.',
          });
          continue;
        }

        try {
          const generated = result.value;
          const title = `${generated.infinitive} | ${input.headingText}`;
          const patch = worksheetPatchFromGeneratedJson({
            title,
            documentSize: 'a5-landscape',
            showSolutions: false,
            status: 'draft',
            brandProfileId: input.brandProfileId,
            context: {
              ...baseContext,
            },
            blocks: [
              {
                type: 'germanVerbTable',
                tableStyle: 'extended',
                tense: input.tense,
                groupId: '',
                groupIndex: 0,
                groupSize: 1,
                hideInfinitiveBadge: true,
                showInfinitiveHeading: true,
                infinitiveHeadingText: input.headingText,
                leftVerb: generated.infinitive,
                leftForms: generated.forms,
                leftAuxiliary: generated.auxiliary,
                leftParticiple: generated.participle,
                comparisonAuxiliary: generated.comparisonAuxiliary,
                separablePrefix: generated.separablePrefix ?? '',
                rightVerb: 'haben',
                forms: HABEN_FORMS,
                rightAuxiliary: 'haben',
                rightParticiple: 'gehabt',
                multipleVerbCount: 5,
                multipleBadgeStyle: 'light',
                multipleVerbs: DEFAULT_MULTIPLE_VERBS,
              },
            ],
          }, input.brandProfileId);

          const worksheet = await createWorksheet(user.id, patch);
          if (!worksheet) throw new Error('Worksheet could not be created.');
          worksheets.push({ id: worksheet.id, title: worksheet.title });
        } catch (error) {
          if (!triedConstraintRepair && isDocumentSizeConstraintError(error)) {
            try {
              triedConstraintRepair = true;
              await ensureA5DocumentSizeConstraint();

              const generated = result.value;
              const title = `${generated.infinitive} | ${input.headingText}`;
              const retryPatch = worksheetPatchFromGeneratedJson({
                title,
                documentSize: 'a5-landscape',
                showSolutions: false,
                status: 'draft',
                brandProfileId: input.brandProfileId,
                context: {
                  ...baseContext,
                },
                blocks: [
                  {
                    type: 'germanVerbTable',
                    tableStyle: 'extended',
                    tense: input.tense,
                    groupId: '',
                    groupIndex: 0,
                    groupSize: 1,
                    hideInfinitiveBadge: true,
                    showInfinitiveHeading: true,
                    infinitiveHeadingText: input.headingText,
                    leftVerb: generated.infinitive,
                    leftForms: generated.forms,
                    leftAuxiliary: generated.auxiliary,
                    leftParticiple: generated.participle,
                    comparisonAuxiliary: generated.comparisonAuxiliary,
                    separablePrefix: generated.separablePrefix ?? '',
                    rightVerb: 'haben',
                    forms: HABEN_FORMS,
                    rightAuxiliary: 'haben',
                    rightParticiple: 'gehabt',
                    multipleVerbCount: 5,
                    multipleBadgeStyle: 'light',
                    multipleVerbs: DEFAULT_MULTIPLE_VERBS,
                  },
                ],
              }, input.brandProfileId);

              const retriedWorksheet = await createWorksheet(user.id, retryPatch);
              if (!retriedWorksheet) throw new Error('Worksheet could not be created.');
              worksheets.push({ id: retriedWorksheet.id, title: retriedWorksheet.title });
              continue;
            } catch (repairError) {
              failures.push({
                infinitive,
                error: repairError instanceof Error
                  ? repairError.message
                  : 'A5 document size migration failed.',
              });
              continue;
            }
          }
          failures.push({
            infinitive,
            error: error instanceof Error ? error.message : 'Worksheet creation failed.',
          });
        }
      }
    }

    return NextResponse.json({ worksheets, failures }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Automation failed.' },
      { status: 400 },
    );
  }
}
