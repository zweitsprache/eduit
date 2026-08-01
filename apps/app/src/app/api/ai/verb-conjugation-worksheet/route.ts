import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { educationalContentModel } from '@/lib/ai';
import { validateWorksheetPatch } from '@/lib/worksheets';
import { worksheetContextPrompt } from '@/lib/ai-generation';
import { germanProgressionInstruction } from '@/lib/german-language-progression';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const personKeys = [
  'ich', 'du', 'formalSingular', 'thirdSingular',
  'wir', 'ihr', 'formalPlural', 'thirdPlural',
] as const;

const verbSchema = z.object({
  infinitive: z.string().trim().min(1).max(80),
  separablePrefix: z.string().trim().max(30).optional().default(''),
  forms: z.record(z.enum(personKeys), z.string().trim().min(1).max(100)),
});

const requestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  level: z.enum(['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2']),
  phase: z.enum(['beginning', 'middle', 'towards-end', 'completed']),
  verbs: z.array(verbSchema).min(1).max(30),
  context: z.unknown(),
});

function shuffled<T>(values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    const input = requestSchema.parse(await request.json());
    const context = validateWorksheetPatch({ context: input.context }).context;
    const progressionInstruction = germanProgressionInstruction({
      artifact: 'continuous-text',
      contentLanguage: 'Deutsch',
      selection: { level: input.level, phase: input.phase },
    });

    const generated: string[][] = [];
    for (let batchStart = 0; batchStart < input.verbs.length; batchStart += 3) {
      const batch = await Promise.all(input.verbs
        .slice(batchStart, batchStart + 3)
        .map(async (verb) => {
      const selectedPeople = shuffled([...personKeys]).slice(0, 6);
      const sentenceShape = Object.fromEntries(selectedPeople.map((person) => [
        person,
        z.string().trim().min(10).max(300),
      ])) as Record<typeof selectedPeople[number], z.ZodString>;
      const resultSchema = z.object({
        sentences: z.object(sentenceShape),
      });
      const { output } = await generateText({
        model: educationalContentModel,
        output: Output.object({ schema: resultSchema }),
        maxRetries: 3,
        temperature: 0.65,
        system: `Du erstellst klare Konjugationsübungen für erwachsene Lernende
in Schweizer DaZ-Kursen. Verwende Schweizer Standarddeutsch und immer «» für
Anführungszeichen. Schreibe natürliche, alltagsnahe und abwechslungsreiche
Einzelsätze.`,
        prompt: `Erstelle genau sechs unabhängige Übungssätze für das Verb
«${verb.infinitive}».

Verlangte Personalformen und exakte Verbformen:
${selectedPeople.map((person) => `- ${person}: ${verb.forms[person]}`).join('\n')}

Setze in jedem Satz genau an der Position des konjugierten Verbs den Marker
[[VERB]]. Schreibe weder die Verbform noch den Infinitiv in den Satz. Gib im
Objekt sentences für jeden oben genannten Schlüssel genau den zugehörigen Satz
zurück. Beginne den Satz wenn möglich mit dem jeweiligen Personalpronomen.
${verb.separablePrefix
  ? `«${verb.infinitive}» ist trennbar mit dem Präfix
«${verb.separablePrefix}». Setze [[VERB]] an die Position des konjugierten
Verbstamms und [[PREFIX]] genau an die grammatisch korrekte Position des
abgetrennten Präfixes. Jeder Satz muss beide Marker genau einmal enthalten.`
  : 'Jeder Satz muss den Marker [[VERB]] genau einmal enthalten.'}

Der Arbeitsblatttitel «${input.title}» ist nur dann der thematische Kontext,
wenn er ein erkennbares Sach- oder Alltagsthema bezeichnet. Ist er bloss ein
Verb-, Grammatik- oder Formtitel, verwende verschiedene lebensnahe Kontexte.
Die sechs Sätze sollen inhaltlich variieren.

Arbeitsblattkontext:
${worksheetContextPrompt(context, input.title)}

Verbindliches Sprachniveau:
${progressionInstruction}`,
      });
      return selectedPeople.map((person) => {
        const sentence = output.sentences[person];
        const form = verb.forms[person];
        const prefix = verb.separablePrefix.trim();
        const hasSeparatedPrefix = prefix
          && form.toLocaleLowerCase('de-DE').endsWith(prefix.toLocaleLowerCase('de-DE'));
        const baseForm = hasSeparatedPrefix
          ? form.slice(0, -prefix.length).trimEnd()
          : form;
        let preparedSentence = sentence;
        if (hasSeparatedPrefix && !preparedSentence.includes('[[PREFIX]]')) {
          preparedSentence = /[.!?]$/.test(preparedSentence)
            ? preparedSentence.replace(/([.!?])$/, ' [[PREFIX]]$1')
            : `${preparedSentence} [[PREFIX]]`;
        }
        let normalized = preparedSentence
          .replace('[[VERB]]', `{{blank:${baseForm}}} [${verb.infinitive}]`)
          .replace('[[PREFIX]]', hasSeparatedPrefix ? `{{blank:${prefix}}}` : '');
        if (/^Sie\s/.test(normalized)) {
          const label = person === 'thirdSingular'
            ? 'SINGULAR'
            : person === 'thirdPlural'
              ? 'PLURAL'
              : person === 'formalSingular' || person === 'formalPlural'
                ? 'FORMELL'
                : null;
          if (label) normalized = normalized.replace(/^Sie/, `Sie<sup>${label}</sup>`);
        }
        return normalized;
      });
        }));
      generated.push(...batch);
    }

    return Response.json({ sentences: shuffled(generated.flat()) });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Generation failed.',
    }, { status: 400 });
  }
}
