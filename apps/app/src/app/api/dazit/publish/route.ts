import { get, put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { extractText, getDocumentProxy } from 'unpdf';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { updateWorksheet } from '@/lib/worksheets';
import { sql } from '@/lib/neon';
import { dazitMetadataModel } from '@/lib/ai';
import {
  createLearningLinkToken,
  extractLearningCardsSnapshotFromWorksheetJson,
} from '@/lib/learning-card-publication';
import {
  worksheetSemanticManifestFromJson,
  type WorksheetSemanticManifest,
} from '@/lib/worksheet-semantic-manifest';
import { GRAMMAR_TAG_ID_SET } from '@/lib/grammar-tags';
import { dazitBlobToken } from '@/lib/dazit-blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type PublishMetadata = {
  worksheetId: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  documentType: 'Arbeitsblatt' | 'Merkblatt' | 'Verbtabelle' | 'Deklinationstabelle' | 'Kommunikationskarten' | 'Lernkarten' | 'Wechselspiel' | 'Domino' | 'Dialog' | 'Lesetraining' | 'Wörterliste';
  pages: number;
  language: string;
  difficulty: string;
  hasAnswerKey: boolean;
  tags: string[];
  format?: string;
  languageLevel?: string;
  level?: string;
  actionCompetencies?: string[];
  languageCompetencies?: string[];
  grammarTags?: string[];
  actionField?: string | null;
};

type PublicationSnapshot = {
  worksheetId: string;
  pdfPath: string;
  answerKeyPdfPath: string | null;
  thumbnailPaths: string[];
  sizeBytes: number;
  descriptionHtml: string | null;
  excerpt: string | null;
  searchSnippet: string | null;
  tags: string[];
  level: string | null;
  actionCompetencies: string[];
  languageCompetencies: string[];
  grammarTags: string[];
  actionCompetencyContributionHtml: string | null;
  actionField: string | null;
  publishedRevision: number;
};

const PUBLICATION_LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'] as const;
const ACTION_COMPETENCY_OPTIONS = [
  'Lesen',
  'Leseverstehen',
  'Hören',
  'Hörverstehen',
  'Monologisches Sprechen',
  'Dialogisches Sprechen',
  'Monologisches Schreiben',
  'Dialogisches Schreiben',
] as const;
const LANGUAGE_COMPETENCY_OPTIONS = [
  'Wortschatz',
  'Grammatik',
  'Aussprache',
  'Intonation',
  'Orthografie',
] as const;
const ACTION_FIELD_OPTIONS = [
  'Deutschkurs',
  'Gesundheit',
  'Sicherheit und Notfälle',
  'Familie und Partnerschaft',
  'Kinder und Schule',
  'Soziales Netz',
  'Beratung und Unterstützung',
  'Einkaufen',
  'Ernährung',
  'Wohnen',
  'Mobilität',
  'Finanzen und Versicherungen',
  'Behörden',
  'Freizeit und Hobbys',
  'Kultur und Identität',
  'Arbeit',
  'Arbeitssuche',
  'Umwelt und Klima',
  'Technologie',
  'Weiterbildung',
] as const;

const TENSE_TAGS = [
  'Präsens',
  'Präteritum',
  'Perfekt',
  'Plusquamperfekt',
  'Futur I',
  'Futur II',
] as const;

const FALLBACK_TAGS: Record<PublishMetadata['documentType'], string[]> = {
  Arbeitsblatt: ['Arbeitsblatt'],
  Merkblatt: ['Merkblatt'],
  Verbtabelle: ['Verben'],
  Deklinationstabelle: ['Deklination'],
  Kommunikationskarten: ['Kommunikationskarten'],
  Lernkarten: ['Lernkarten'],
  Wechselspiel: ['Wechselspiel', 'Partnerarbeit'],
  Domino: ['Domino'],
  Dialog: ['Dialog', 'Dialogisches Sprechen'],
  Lesetraining: ['Lesetraining', 'Lesen'],
  Wörterliste: ['Wörterliste', 'Wortschatz'],
};

const forbiddenAdultDazTerminology =
  /unterricht|schule|schul|kinder|jugendliche|klassenzimmer|klassenstufe|lehrperson|lehrer|schüler|regeldaz|(?:^|[^A-Za-zÄÖÜäöüß])DaF(?:$|[^A-Za-zÄÖÜäöüß])/i;
const irrelevantProductionLanguage =
  /doppelseitig|kurze(?:n|r)? seite|spiegeln|schneide(?:linie|marke)|drucktechnisch|druckhinweis|seitenumbruch|seitenzahl|der hinweis.+zeigt|das (?:pdf|dokument).+(?:zeigt|weist darauf hin)|die vorlage.+konzipiert/i;

const descriptionSchema = z.object({
  excerpt: z.string().trim().min(120).max(280),
  searchSnippet: z.string().trim().min(90).max(180),
  tags: z.array(z.string().trim().min(2).max(50)).min(1).max(10),
  actionCompetencies: z.array(z.enum(ACTION_COMPETENCY_OPTIONS)).max(3),
  languageCompetencies: z.array(z.enum(LANGUAGE_COMPETENCY_OPTIONS)).min(1).max(5),
  actionField: z.enum(ACTION_FIELD_OPTIONS).nullable(),
  actionCompetencyContribution: z.object({
    summary: z.string().trim().min(100).max(900),
  }),
  introduction: z.string().trim().min(100).max(450),
  sections: z.array(z.object({
    heading: z.string().trim().min(3).max(100),
    paragraphs: z.array(z.string().trim().min(40).max(900)).min(1).max(3),
    bullets: z.array(z.string().trim().min(10).max(300)).max(8),
  })).min(1).max(3),
});

type GeneratedDescription = {
  excerpt: string;
  searchSnippet: string;
  html: string;
  tags: string[];
  level: typeof PUBLICATION_LEVELS[number];
  actionCompetencies: string[];
  languageCompetencies: string[];
  actionField: string | null;
  actionCompetencyContributionHtml: string;
};

function normalizePublicationLevel(value: string | undefined): typeof PUBLICATION_LEVELS[number] | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase().replaceAll(' ', '');
  if (normalized === 'A1.1') return 'A1.1';
  if (normalized === 'A1.2' || normalized === 'A1+') return 'A1.2';
  if (normalized === 'A2.1') return 'A2.1';
  if (normalized === 'A2.2' || normalized === 'A2+') return 'A2.2';
  if (normalized === 'B1.1') return 'B1.1';
  if (normalized === 'B1.2' || normalized === 'B1+') return 'B1.2';
  return null;
}

function applyWorksheetSettingOverrides(
  generated: GeneratedDescription,
  metadata: PublishMetadata,
): GeneratedDescription {
  const actionCompetencyOverride = Array.isArray(metadata.actionCompetencies)
    ? metadata.actionCompetencies.filter((value): value is string => (
      ACTION_COMPETENCY_OPTIONS.includes(value as typeof ACTION_COMPETENCY_OPTIONS[number])
    ))
    : [];
  const languageCompetencyOverride = Array.isArray(metadata.languageCompetencies)
    ? metadata.languageCompetencies.filter((value): value is string => (
      LANGUAGE_COMPETENCY_OPTIONS.includes(value as typeof LANGUAGE_COMPETENCY_OPTIONS[number])
    ))
    : [];
  const actionFieldOverride = typeof metadata.actionField === 'string'
    && ACTION_FIELD_OPTIONS.includes(metadata.actionField as typeof ACTION_FIELD_OPTIONS[number])
    ? metadata.actionField
    : null;

  return {
    ...generated,
    actionCompetencies: actionCompetencyOverride.length
      ? actionCompetencyOverride
      : generated.actionCompetencies,
    languageCompetencies: languageCompetencyOverride.length
      ? languageCompetencyOverride
      : generated.languageCompetencies,
    actionField: actionFieldOverride ?? generated.actionField,
  };
}

function normalizeGrammarTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const unique = new Set<string>();
  value.forEach((item) => {
    if (typeof item !== 'string') return;
    const normalized = item.trim();
    if (!normalized || !GRAMMAR_TAG_ID_SET.has(normalized)) return;
    unique.add(normalized);
  });
  return [...unique].slice(0, 80);
}

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('de-CH')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

async function extractPdfText(pdf: File) {
  try {
    const bytes = new Uint8Array(await pdf.arrayBuffer());
    const document = await getDocumentProxy(bytes);
    const extracted = await extractText(document, { mergePages: true });
    return String(extracted.text)
      .replaceAll('\u0000', '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch {
    return '';
  }
}

function filterGeneratedTags(
  tags: string[],
  documentType: PublishMetadata['documentType'],
  pdfText: string,
) {
  if (!pdfText) return [...new Set(tags.map((tag) => tag.trim()))].slice(0, 10);

  const normalizedPdfText = normalizeSearchText(pdfText);
  const filtered = [...new Set(tags.map((tag) => tag.trim()))]
    .filter((tag) => {
      const normalizedTag = normalizeSearchText(tag);
      if (!TENSE_TAGS.some((tenseTag) => normalizeSearchText(tenseTag) === normalizedTag)) {
        return true;
      }
      return normalizedPdfText.includes(normalizedTag);
    })
    .slice(0, 10);

  if (filtered.length > 0) return filtered;
  return FALLBACK_TAGS[documentType];
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeSwissQuotationMarks(value: string) {
  return value
    .replace(/„([^“\n]+)“/g, '«$1»')
    .replace(/“([^”\n]+)”/g, '«$1»')
    .replace(/‘([^’\n]+)’/g, '«$1»')
    .replace(/"([^"\n]+)"/g, '«$1»')
    .replace(
      /(^|[\s([{])'([^'\n]{1,160})'(?=$|[\s.,;:!?)}\]])/g,
      '$1«$2»',
    );
}

function normalizeDescriptionQuotationMarks(
  description: z.infer<typeof descriptionSchema>,
): z.infer<typeof descriptionSchema> {
  const normalize = <T,>(value: T): T => {
    if (typeof value === 'string') {
      return normalizeSwissQuotationMarks(value) as T;
    }
    if (Array.isArray(value)) return value.map(normalize) as T;
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        normalize(item),
      ])) as T;
    }
    return value;
  };
  return normalize(description);
}

async function generateDescription(
  pdf: File,
  metadata: PublishMetadata,
  worksheetManifest: WorksheetSemanticManifest | null,
  allowTerminologyOverride = false,
) {
  const publicationLevel = normalizePublicationLevel(
    metadata.languageLevel ?? metadata.level,
  );
  if (!publicationLevel) {
    throw new Error('A valid worksheet language level from A1.1 to B1.2 is required.');
  }
  const pdfText = await extractPdfText(pdf);
  const worksheetManifestJson = worksheetManifest
    ? JSON.stringify(worksheetManifest, null, 2)
    : '';
  const worksheetManifestPrompt = worksheetManifestJson.length > 120_000
    ? `${worksheetManifestJson.slice(0, 120_000)}\n[Weitere Inhaltsdetails gekürzt]`
    : worksheetManifestJson;
  const listValidationViolations = (description: z.infer<typeof descriptionSchema>) => {
    const generatedText = JSON.stringify({
      excerpt: description.excerpt,
      searchSnippet: description.searchSnippet,
      introduction: description.introduction,
      sections: description.sections,
      contribution: description.actionCompetencyContribution,
    });
    const missingLearningCardReference = metadata.documentType === 'Lernkarten'
      && (
        !/Lernkarten/i.test(description.excerpt)
        || !/Lernkarten/i.test(description.searchSnippet)
        || !/Lernkarten/i.test(JSON.stringify({
          introduction: description.introduction,
          sections: description.sections,
        }))
      );
    const violations: string[] = [];
    const mentionedLevels = generatedText.match(/\b(?:A1\.1|A1\.2|A2\.1|A2\.2|B1\.1|B1\.2)\b/gi)
      ?? [];
    if (mentionedLevels.some((level) => level.toUpperCase() !== publicationLevel)) {
      violations.push('description contains a language level that differs from the worksheet setting');
    }
    if (forbiddenAdultDazTerminology.test(generatedText)) {
      violations.push('forbidden adult DaZ terminology detected');
    }
    if (irrelevantProductionLanguage.test(generatedText)) {
      violations.push('irrelevant production language detected');
    }
    if (missingLearningCardReference) {
      violations.push('Lernkarten references are missing in excerpt/snippet/body');
    }
    return violations;
  };

  let output: z.infer<typeof descriptionSchema> | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await generateText({
    model: dazitMetadataModel,
    output: Output.object({ schema: descriptionSchema }),
    maxRetries: 4,
    temperature: 0.3,
system: `Du bist ein erfahrener Schweizer Bildungsredaktor und SEO-Texter.
Erfasse aus dem vollständigen PDF vor allem den sprachlichen und didaktischen
Inhalt. Verfasse präzise,
hilfreiche Metadaten für eine Bibliothek mit Materialien für DaZ-Kurse. Verwende
Schweizer Standarddeutsch (ss statt ß). Beschreibe nur Inhalte, Lernziele,
Aufgabentypen und Einsatzmöglichkeiten, die im PDF tatsächlich erkennbar sind.
Keine Keyword-Aufzählungen, keine unbelegten Versprechen und keine Hinweise auf
deine Analyse. Schreibe natürlich, konkret und suchmaschinenfreundlich.
Formuliere sachlich und zurückhaltend. Vermeide Superlative, Werbesprache,
übertriebene Nutzenversprechen und wertende Aussagen wie «ideal», «perfekt»,
«unverzichtbar», «besonders wichtig» oder «garantiert». Erkläre nur so viel,
wie Kursleiter:innen für die Einordnung des Materials benötigen. Wiederhole
dieselben Informationen nicht in mehreren Abschnitten.

Der Text ist eine SEO-optimierte Materialbeschreibung für Kursleiter:innen,
keine Dokumentanalyse. Beschreibe direkt, was sprachlich behandelt und geübt
wird. Priorisiere Grammatik, Wortschatz, sprachliche Strukturen, Lernziel,
Aufgabenformat und eine knappe Einsatzmöglichkeit im DaZ-Kurs.

Wenn eine semantische Arbeitsblattstruktur im Benutzerauftrag enthalten ist,
ist sie die verbindliche Quelle für logische Aufgaben, Aufgabengrenzen,
Instruktionen, Inhalte und Anzahl der Einträge. Das PDF dient dann nur als
ergänzender Beleg für sichtbare Formulierungen und Darstellungsvarianten.
Erfinde aufgrund von Seiten-, Tabellen- oder Layoutgrenzen niemals zusätzliche
Aufgaben, die in der semantischen Struktur nicht als eigene logische Aufgabe
aufgeführt sind.

Ignoriere rein technische oder gestalterische Elemente vollständig: Druck- und
Duplexhinweise, Spiegelung an langer oder kurzer Seite, Schneide- und Falzlinien,
Seitenzahlen, Seitenumbrüche, Ränder, Logos, Kopf- und Fusszeilen sowie
Positionierung auf der Seite. Erwähne sie weder als Inhalt noch als Beleg für
eine Interpretation. Schreibe niemals Formulierungen wie «der Hinweis zeigt»,
«das Dokument zeigt», «die Vorlage ist konzipiert» oder andere Sätze, die den
Analyseprozess beschreiben.

Vergleiche alle PDF-Seiten systematisch miteinander. Prüfe insbesondere, ob
dieselbe Aufgabe mehrfach in unterschiedlichen Unterstützungsstufen vorkommt,
zum Beispiel einmal mit Wortbank und einmal ohne Wortbank. Benenne solche
Varianten ausdrücklich als differenzierte Fassungen derselben Übung und erkläre
präzise den erkennbaren Unterschied. Bezeichne eine Fassung mit Wortbank als
stärker unterstützt und eine identische Fassung ohne Wortbank als
anspruchsvoller beziehungsweise weniger gestützt. Behaupte keine Unterschiede,
die auf den Seiten nicht sichtbar sind.

Behandle Fortsetzungen derselben Aufgabe über mehrere Seiten oder Tabellenblöcke
niemals als separate Aufgaben. Dies gilt insbesondere für Artikel- und
Pluraltraining: Wenn die Nummerierung der Nomen über einen nachfolgenden Block
hinweg weiterläuft, ist dieser Block eine technische Fortsetzung derselben
Übung, auch wenn Spaltenüberschriften wiederholt werden. Zähle und beschreibe
alle solchen Fortsetzungsblöcke gemeinsam als genau eine Aufgabe. Ein
abschliessender Bereich «Suchen Sie weitere Nomen / Substantive zum Thema.» ist
eine ergänzende Teilaufgabe innerhalb dieses Artikel- und Pluraltrainings und
keine weitere eigenständige Hauptaufgabe.

Verbindliche DaZ-Terminologie:
- Dazit richtet sich ausschliesslich an DaZ-Kurse für Erwachsene in der
  Schweiz. Stelle diesen Kontext klar heraus, wenn er für den Text relevant ist.
- Erwähne niemals Kinder, Jugendliche, Schule, Schulklassen, Klassenstufen,
  Lehrpersonen, Schülerinnen oder Schüler.
- Stelle niemals einen Bezug zu regulärem Deutschunterricht, DaF-Unterricht,
  muttersprachlichem Deutschunterricht oder schulischem Unterricht her.
- Erfinde keine Altersgruppe. Verwende bei Personen ausschliesslich erwachsene
  Lernende.
- Schreibe immer "DaZ-Kurs", niemals "Unterricht".
- Schreibe "Kursleiter:in" beziehungsweise "Kursleiter:innen", niemals
  "Lehrer:in", "Lehrer:innen", "Lehrperson" oder "Lehrpersonen".
- Schreibe "Lernende" beziehungsweise in der Einzahl "Lernende:r", niemals
  "Schüler:in", "Schüler:innen", "Schüler" oder "Schülerin".`,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'file',
          data: new Uint8Array(await pdf.arrayBuffer()),
          mediaType: 'application/pdf',
          filename: `${metadata.slug}.pdf`,
        },
        {
          type: 'text',
          text: `Titel: ${metadata.title}
Dokumenttyp: ${metadata.documentType}
Verbindliches Niveau aus den Arbeitsblatteinstellungen: ${publicationLevel}

Bewerte oder bestimme das Sprachniveau nicht selbst. Das angegebene Niveau ist
verbindlich. Falls du ein Niveau im Kartenauszug, SEO-Snippet oder in der
Beschreibung erwähnst, verwende ausschliesslich ${publicationLevel}.

${worksheetManifest
  ? `Verbindliche semantische Arbeitsblattstruktur:
${worksheetManifestPrompt}

Regeln zur Struktur:
- logicalTasks enthält die logischen Aufgaben des Materials.
- logicalTaskCount: 1 bedeutet genau eine Aufgabe, unabhängig von physicalBlockCount.
- physicalBlockCount bezeichnet ausschliesslich technische Fortsetzungsblöcke.
- hasOwnEntrySubtask bezeichnet eine ergänzende Teilaufgabe innerhalb derselben Aufgabe.
- Zähle niemals PDF-Seiten oder Fortsetzungsblöcke als zusätzliche Aufgaben.`
  : `Für dieses ältere Material ist keine semantische Arbeitsblattstruktur verfügbar.
Leite die Struktur vorsichtig aus dem PDF ab und fasse sichtbare Fortsetzungen
mit durchlaufender Nummerierung als eine Aufgabe zusammen.`}

${metadata.documentType === 'Lernkarten'
  ? `Verbindliche Regel für diesen Dokumenttyp:
- Beschreibe das Material ausdrücklich als Lernkarten beziehungsweise als
  Lernkartenset. Das Wort «Lernkarten» muss im Kartenauszug und in der
  ausführlichen Beschreibung vorkommen.
- Interpretiere zusammengehörende Vorder- und Rückseiten als zwei Seiten
  derselben Lernkarten. Beschreibe knapp, welche Information oder Aufgabe auf
  der Vorderseite steht und wie die Rückseite ergänzt, auflöst oder kontrolliert.
- Bezeichne die Karten nicht als Arbeitsblätter, Tabellen oder einzelne Seiten.
- Erwähne weder doppelseitiges Drucken noch andere Druck-, Schnitt- oder
  Produktionshinweise.`
  : ''}

Erstelle:
1. Einen eigenständigen Kartenauszug mit 120 bis 280 Zeichen.
1a. Ein separates SEO-Snippet mit 90 bis 180 Zeichen für Suchergebnisse.
    Es soll den sprachlichen Inhalt präzise benennen, natürliche Suchbegriffe
    enthalten und unabhängig vom Kartenauszug formuliert sein.
2. Eine kompakte ausführliche Beschreibung mit einer Einleitung von mindestens 100
   Zeichen und 1 bis 3 logisch gegliederten Abschnitten. Jeder Absatz umfasst
   mindestens 40 Zeichen. Nutze Aufzählungspunkte nur, wenn sie den Inhalt
   besser erfassbar machen; jeder Aufzählungspunkt umfasst mindestens 10 Zeichen.
   Wenn das PDF dieselbe Übung in Varianten mit und ohne Hilfestellung enthält,
   muss dieser Aufbau sowohl im Kartenauszug als auch in der ausführlichen
   Beschreibung konkret genannt werden.
3. Bis zu 10 kurze, konkrete Schlagwörter. Verwende keine generischen Begriffe
   wie "Material", "PDF" oder "DaZ", wenn ein inhaltlich genauerer Begriff
   möglich ist. Gib jedes Schlagwort ohne Rautezeichen aus.
   Jedes Schlagwort muss genau einen Begriff bezeichnen. Wenn mehrere wichtige
   Verben oder Nomen vorkommen, erstelle für jedes Wort ein separates
   Schlagwort und gruppiere sie niemals in einem Eintrag. Beispiel:
   «können müssen sollen dürfen» ist verboten; korrekt sind die vier
   separaten Schlagwörter «können», «müssen», «sollen», «dürfen». Priorisiere
   bei der Begrenzung auf 10 die zentralen Einzelbegriffe des Dokuments.
4. Bestimme die Sprachhandlungskompetenz nur, wenn das Dokument eine konkrete
   rezeptive oder produktive Sprachhandlung erkennbar unterstützt. Gib sonst
   eine leere Liste zurück. Eine Grammatik- oder Verbtabelle allein ist keine
   Sprachhandlung und darf nicht automatisch Lesen oder Schreiben zugeordnet
   werden.
5. Bestimme alle unmittelbar behandelten Sprachkompetenzen.
6. Beschreibe im Beitrag zur Sprachhandlungskompetenz knapp und sachlich, wie der sprachliche
   Inhalt die Handlungsfähigkeit erwachsener Lernender erweitert. Beschreibe
   ausdrücklich nicht bloss die Fertigkeit, das Aufgabenformat oder die
   Tabellenstruktur. Beispiel Modalverben: Lernende können ausdrücken, was sie
   können, müssen, dürfen oder möchten. Nenne konkrete kommunikative
   Verwendungsmöglichkeiten, die aus dem PDF belegbar sind. Die
   Text umfasst mindestens 100 Zeichen. Generiere keine Beispielsätze,
   Musterformulierungen, Dialogbeispiele oder Listen mit möglichen Äusserungen.
7. Ordne höchstens ein Handlungsfeld aus der folgenden geschlossenen Liste zu:
   Deutschkurs; Gesundheit; Sicherheit und Notfälle; Familie und Partnerschaft;
   Kinder und Schule; Soziales Netz; Beratung und Unterstützung; Einkaufen;
   Ernährung; Wohnen; Mobilität; Finanzen und Versicherungen; Behörden;
   Freizeit und Hobbys; Kultur und Identität; Arbeit; Arbeitssuche; Umwelt und
   Klima; Technologie; Weiterbildung.
   Verwende ein Handlungsfeld nur, wenn der konkrete Lebensbereich im Dokument
   eindeutig und zentral ist. Reine Grammatik-, Aussprache- oder
   Wortschatzmaterialien ohne klaren Lebensbereich erhalten null. Wähle nicht
   «Deutschkurs» bloss deshalb, weil das Dokument in einem DaZ-Kurs verwendet
   wird.
Der Text soll Kursleiter:innen bei der Entscheidung helfen, ob das Material zu
ihrem DaZ-Kurs für Erwachsene passt. Relevante Suchbegriffe sollen natürlich aus dem
tatsächlichen Inhalt des PDFs entstehen.
${attempt > 0
  ? `KORREKTURVERSUCH ${attempt}: Der vorherige Entwurf enthielt verbotene,
irrelevante oder analytisch klingende Formulierungen. Formuliere vollständig
neu. Konzentriere dich ausschliesslich auf den sprachlichen Inhalt, das Lernziel
und den knappen Einsatz im DaZ-Kurs. Erwähne keine Druckproduktion, Seitengestaltung
oder sichtbaren Hinweise. Verwende ausschliesslich DaZ-Kurs, Kursleiter:in
beziehungsweise Kursleiter:innen und Lernende.`
  : ''}`,
        },
      ],
    }],
    });
    output = normalizeDescriptionQuotationMarks(result.output);
    if (listValidationViolations(output).length === 0) break;
  }
  if (!output) throw new Error('Description generation failed.');
  const violations = listValidationViolations(output);
  if (violations.length > 0 && !allowTerminologyOverride) {
    throw new Error(
      `The generated description did not follow the adult DaZ terminology rules. Issues: ${violations.join('; ')}. Publish again or approve override.`,
    );
  }
  const sections = output.sections.map((section) => {
    const paragraphs = section.paragraphs
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join('');
    const bullets = section.bullets.length
      ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
      : '';
    return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}</section>`;
  }).join('');
  return {
    excerpt: output.excerpt,
    searchSnippet: output.searchSnippet,
    html: `<p>${escapeHtml(output.introduction)}</p>${sections}`,
    tags: filterGeneratedTags(output.tags, metadata.documentType, pdfText),
    level: publicationLevel,
    actionCompetencies: output.actionCompetencies,
    languageCompetencies: output.languageCompetencies,
    actionField: output.actionField,
    actionCompetencyContributionHtml: `<p>${escapeHtml(
      output.actionCompetencyContribution.summary,
    )}</p>`,
  };
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    const workflowToken = request.headers.get('x-eduit-workflow-token');
    const isWorkflowRequest = Boolean(
      process.env.QSTASH_TOKEN
      && workflowToken === process.env.QSTASH_TOKEN,
    );
    if (!user && !isWorkflowRequest) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    if (user && !user.isAdmin && !isWorkflowRequest) {
      return NextResponse.json({ error: 'Only administrators can publish worksheets.' }, { status: 403 });
    }
    const token = dazitBlobToken();
    if (!token) {
      return NextResponse.json(
        {
          error: 'Dazit publishing is not configured. Add DAZIT_BLOB_READ_WRITE_TOKEN and DAZIT_BLOB_STORE_ID to the editor environment.',
        },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const pdf = formData.get('pdf');
    const metadataValue = formData.get('metadata');
    const worksheetJsonValue = formData.get('worksheetJson');
    const worksheetManifestValue = formData.get('worksheetSemanticManifest');
    const requestedMode = formData.get('mode');
    const mode = requestedMode === 'pdf-only'
      || requestedMode === 'worksheet-settings-only'
      || requestedMode === 'metadata-only'
      ? requestedMode
      : 'full';
    if (isWorkflowRequest && mode !== 'metadata-only') {
      return NextResponse.json({ error: 'Invalid workflow publishing mode.' }, { status: 403 });
    }
    if (!(pdf instanceof File) || pdf.type !== 'application/pdf') {
      return NextResponse.json({ error: 'A PDF file is required.' }, { status: 400 });
    }
    if (typeof metadataValue !== 'string') {
      return NextResponse.json({ error: 'Worksheet metadata is required.' }, { status: 400 });
    }
    const thumbnails = formData.getAll('thumbnails')
      .filter((value): value is File => value instanceof File);
    const metadata = JSON.parse(metadataValue) as PublishMetadata;
    const learningCardsSnapshot = typeof worksheetJsonValue === 'string'
      ? extractLearningCardsSnapshotFromWorksheetJson(worksheetJsonValue)
      : null;
    if (typeof worksheetJsonValue === 'string' && worksheetJsonValue.length > 4_000_000) {
      return NextResponse.json({ error: 'Worksheet JSON exceeds the 4 MB limit.' }, { status: 413 });
    }
    if (typeof worksheetManifestValue === 'string' && worksheetManifestValue.length > 500_000) {
      return NextResponse.json({ error: 'Worksheet semantic manifest is too large.' }, { status: 413 });
    }
    const worksheetManifest = typeof worksheetJsonValue === 'string'
      ? worksheetSemanticManifestFromJson(worksheetJsonValue)
      : typeof worksheetManifestValue === 'string'
        ? worksheetSemanticManifestFromJson(worksheetManifestValue)
        : null;
    if (mode === 'full' && (typeof worksheetJsonValue !== 'string' || !worksheetManifest)) {
      return NextResponse.json(
        { error: 'Valid worksheet JSON is required for full publishing.' },
        { status: 400 },
      );
    }
    if (!metadata.worksheetId || !metadata.slug || !metadata.title) {
      return NextResponse.json({ error: 'Invalid worksheet metadata.' }, { status: 400 });
    }
    const documentTypes = ['Arbeitsblatt', 'Merkblatt', 'Verbtabelle', 'Deklinationstabelle', 'Kommunikationskarten', 'Lernkarten', 'Wechselspiel', 'Domino', 'Dialog', 'Lesetraining', 'Wörterliste'];
    if (!documentTypes.includes(metadata.documentType)) {
      return NextResponse.json({ error: 'Invalid Dazit document type.' }, { status: 400 });
    }
    if (mode !== 'metadata-only' && (!thumbnails.length || thumbnails.length !== metadata.pages)) {
      return NextResponse.json({ error: 'One thumbnail per PDF page is required.' }, { status: 400 });
    }
    const revisionRows = await sql`
      select w.source_revision as "sourceRevision",
             b.name as "brandName"
      from worksheets w
      left join brand_profiles b on b.id = w.brand_profile_id
      where w.id = ${metadata.worksheetId}
    ` as Array<{ sourceRevision: string | number; brandName: string | null }>;
    if (!revisionRows[0]) {
      return NextResponse.json({ error: 'Worksheet not found.' }, { status: 404 });
    }
    if ((revisionRows[0].brandName ?? '').trim().toLowerCase() !== 'dazit') {
      return NextResponse.json(
        { error: 'Only worksheets using the Dazit brand can be published to Dazit.' },
        { status: 400 },
      );
    }
    const sourceRevision = Number(revisionRows[0].sourceRevision);
    const publicationRows = await sql`
      select
        worksheet_id as "worksheetId",
        pdf_path as "pdfPath",
        answer_key_pdf_path as "answerKeyPdfPath",
        thumbnail_paths as "thumbnailPaths",
        size_bytes as "sizeBytes",
        description_html as "descriptionHtml",
        excerpt,
        search_snippet as "searchSnippet",
        tags,
        level,
        action_competencies as "actionCompetencies",
        language_competencies as "languageCompetencies",
        grammar_tags as "grammarTags",
        action_competency_contribution_html as "actionCompetencyContributionHtml",
        action_field as "actionField",
        published_revision as "publishedRevision"
      from dazit_publications
      where worksheet_id = ${metadata.worksheetId}
    ` as Array<{
      worksheetId: string;
      pdfPath: string;
      answerKeyPdfPath: string | null;
      thumbnailPaths: string[];
      sizeBytes: number;
      descriptionHtml: string | null;
      excerpt: string | null;
      searchSnippet: string | null;
      tags: string[];
      level: string | null;
      actionCompetencies: string[];
      languageCompetencies: string[];
      grammarTags: string[];
      actionCompetencyContributionHtml: string | null;
      actionField: string | null;
      publishedRevision: string | number;
    }>;
    if (mode !== 'full' && !publicationRows[0]) {
      return NextResponse.json(
        { error: 'This publishing mode requires an existing Dazit publication.' },
        { status: 400 },
      );
    }
    const learningPublicationRows = metadata.documentType === 'Lernkarten'
      ? await sql`
        select
          token,
          title,
          snapshot,
          is_published as "isPublished"
        from learning_card_publications
        where worksheet_id = ${metadata.worksheetId}
      ` as Array<{
        token: string;
        title: string;
        snapshot: unknown;
        isPublished: boolean;
      }>
      : [];
    const existingLearningPublication = learningPublicationRows[0];
    if (metadata.documentType === 'Lernkarten' && mode === 'full' && !learningCardsSnapshot) {
      return NextResponse.json(
        { error: 'A learning-cards worksheet JSON snapshot is required.' },
        { status: 400 },
      );
    }
    const allowDescriptionOverride = formData.get('allowDescriptionOverride') === 'true';
    const generatedDescription = mode === 'full' || mode === 'metadata-only'
      ? await generateDescription(pdf, metadata, worksheetManifest, allowDescriptionOverride)
      : null;
    const description = generatedDescription
      ? applyWorksheetSettingOverrides(generatedDescription, metadata)
      : null;
    const existingPublication = publicationRows[0] as PublicationSnapshot | undefined;
    const effectivePublishedRevision = mode === 'metadata-only' && existingPublication
      ? Number(existingPublication.publishedRevision)
      : sourceRevision;
    const grammarTagsFromMetadata = normalizeGrammarTags(metadata.grammarTags);
    const worksheetSettingsOverride = existingPublication
      ? {
        level: normalizePublicationLevel(metadata.languageLevel) ?? existingPublication.level,
        actionCompetencies: Array.isArray(metadata.actionCompetencies)
          && metadata.actionCompetencies.length
          ? metadata.actionCompetencies
          : existingPublication.actionCompetencies,
        languageCompetencies: Array.isArray(metadata.languageCompetencies)
          && metadata.languageCompetencies.length
          ? metadata.languageCompetencies
          : existingPublication.languageCompetencies,
        actionField: typeof metadata.actionField === 'string' && metadata.actionField
          ? metadata.actionField
          : existingPublication.actionField,
        grammarTags: grammarTagsFromMetadata
          ?? existingPublication.grammarTags,
      }
      : null;
    const grammarTags = grammarTagsFromMetadata
      ?? existingPublication?.grammarTags
      ?? [];

    const pdfPath = mode === 'metadata-only'
      ? publicationRows[0].pdfPath
      : `worksheets/${metadata.worksheetId}/${metadata.slug}.pdf`;
    const answerKeyPdfPath = mode === 'metadata-only'
      ? publicationRows[0].answerKeyPdfPath
      : (metadata.hasAnswerKey ? `worksheets/${metadata.worksheetId}/${metadata.slug}-solution-key.pdf` : null);
    if (mode !== 'metadata-only') {
      await put(pdfPath, pdf, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/pdf',
        token,
      });
    }
    if (mode !== 'metadata-only' && metadata.hasAnswerKey && answerKeyPdfPath) {
      const solutionKeyPdf = formData.get('solutionKeyPdf');
      if (solutionKeyPdf instanceof File && solutionKeyPdf.type === 'application/pdf') {
        await put(answerKeyPdfPath, solutionKeyPdf, {
          access: 'private',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/pdf',
          token,
        });
      }
    }
    const thumbnailPaths = mode === 'metadata-only'
      ? publicationRows[0].thumbnailPaths
      : await Promise.all(thumbnails.map(async (thumbnail, index) => {
        if (thumbnail.type !== 'image/webp') throw new Error('Invalid thumbnail format.');
        const path = `worksheets/${metadata.worksheetId}/thumbnails/page-${index + 1}.webp`;
        await put(path, thumbnail, {
          access: 'private',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'image/webp',
          token,
        });
        return path;
      }));
    const sizeBytes = mode === 'metadata-only' ? publicationRows[0].sizeBytes : pdf.size;
    const manifestPath = `library/${metadata.worksheetId}.json`;
    let existingManifest: Record<string, unknown> = {};
    if (mode !== 'full') {
      const existingBlob = await get(manifestPath, {
        access: 'private',
        token,
        useCache: false,
      });
      if (existingBlob?.statusCode === 200) {
        existingManifest = await new Response(existingBlob.stream).json()
          .catch(() => ({})) as Record<string, unknown>;
      }
    }
    const manifest = description
      ? {
        ...existingManifest,
        ...metadata,
        pdfPath,
        thumbnailPaths,
        sizeBytes,
        downloads: existingManifest.downloads ?? 0,
        description: description.excerpt,
        searchSnippet: description.searchSnippet,
        tags: description.tags,
        level: description.level,
        worksheetSemanticManifest: worksheetManifest
          ?? existingManifest.worksheetSemanticManifest,
        actionCompetencies: description.actionCompetencies,
        languageCompetencies: description.languageCompetencies,
        grammarTags,
        actionField: description.actionField,
        publishedAt: new Date().toISOString(),
      }
      : mode === 'worksheet-settings-only' && existingPublication && worksheetSettingsOverride
        ? {
          ...existingManifest,
          ...metadata,
          pdfPath,
          answerKeyPdfPath,
          thumbnailPaths,
          sizeBytes,
          downloads: existingManifest.downloads ?? 0,
          description: existingManifest.description
            ?? existingPublication.descriptionHtml
            ?? '',
          searchSnippet: existingManifest.searchSnippet
            ?? existingPublication.searchSnippet
            ?? '',
          tags: existingManifest.tags ?? existingPublication.tags ?? [],
          level: worksheetSettingsOverride.level,
          actionCompetencies: worksheetSettingsOverride.actionCompetencies,
          languageCompetencies: worksheetSettingsOverride.languageCompetencies,
          grammarTags: worksheetSettingsOverride.grammarTags,
          actionField: worksheetSettingsOverride.actionField,
          actionCompetencyContributionHtml: existingManifest.actionCompetencyContributionHtml
            ?? existingPublication.actionCompetencyContributionHtml
            ?? '',
          publishedAt: new Date().toISOString(),
        }
      : {
        ...existingManifest,
        pdfPath,
        thumbnailPaths,
        pages: metadata.pages,
        sizeBytes: pdf.size,
        updatedAt: new Date().toISOString(),
      };
    await put(manifestPath, JSON.stringify(manifest), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      token,
    });
    if (description) {
      await sql`
      insert into dazit_publications (
        worksheet_id,
        slug,
        title,
        document_type,
        has_answer_key,
        pdf_path,
        answer_key_pdf_path,
        thumbnail_paths,
        page_count,
        size_bytes,
        description_html,
        excerpt,
        search_snippet,
        tags,
        level,
        action_competencies,
        language_competencies,
        grammar_tags,
        action_competency_contribution_html,
        action_field,
        metadata_version,
        published_revision,
        published_at,
        updated_at
      ) values (
        ${metadata.worksheetId},
        ${metadata.slug},
        ${metadata.title},
        ${metadata.documentType},
        ${metadata.hasAnswerKey},
        ${pdfPath},
        ${answerKeyPdfPath},
        ${JSON.stringify(thumbnailPaths)}::jsonb,
        ${metadata.pages},
        ${sizeBytes},
        ${description.html},
        ${description.excerpt},
        ${description.searchSnippet},
        ${JSON.stringify(description.tags)}::jsonb,
        ${description.level},
        ${JSON.stringify(description.actionCompetencies)}::jsonb,
        ${JSON.stringify(description.languageCompetencies)}::jsonb,
        ${JSON.stringify(grammarTags)}::jsonb,
        ${description.actionCompetencyContributionHtml},
        ${description.actionField},
        4,
        ${effectivePublishedRevision},
        now(),
        now()
      )
      on conflict (worksheet_id) do update set
        slug = excluded.slug,
        title = excluded.title,
        document_type = excluded.document_type,
        has_answer_key = excluded.has_answer_key,
        pdf_path = excluded.pdf_path,
        answer_key_pdf_path = excluded.answer_key_pdf_path,
        thumbnail_paths = excluded.thumbnail_paths,
        page_count = excluded.page_count,
        size_bytes = excluded.size_bytes,
        description_html = excluded.description_html,
        excerpt = excluded.excerpt,
        search_snippet = excluded.search_snippet,
        tags = excluded.tags,
        level = excluded.level,
        action_competencies = excluded.action_competencies,
        language_competencies = excluded.language_competencies,
        grammar_tags = excluded.grammar_tags,
        action_competency_contribution_html = excluded.action_competency_contribution_html,
        action_field = excluded.action_field,
        metadata_version = excluded.metadata_version,
        published_revision = excluded.published_revision,
        updated_at = now()
      `;
    } else if (mode === 'worksheet-settings-only' && existingPublication && worksheetSettingsOverride) {
      await sql`
        update dazit_publications
        set slug = ${metadata.slug},
            title = ${metadata.title},
            document_type = ${metadata.documentType},
            has_answer_key = ${metadata.hasAnswerKey},
            pdf_path = ${pdfPath},
            answer_key_pdf_path = ${answerKeyPdfPath},
            thumbnail_paths = ${JSON.stringify(thumbnailPaths)}::jsonb,
            page_count = ${metadata.pages},
            size_bytes = ${sizeBytes},
            level = ${worksheetSettingsOverride.level},
            action_competencies = ${JSON.stringify(worksheetSettingsOverride.actionCompetencies)}::jsonb,
            language_competencies = ${JSON.stringify(worksheetSettingsOverride.languageCompetencies)}::jsonb,
            grammar_tags = ${JSON.stringify(worksheetSettingsOverride.grammarTags)}::jsonb,
            action_field = ${worksheetSettingsOverride.actionField},
            published_revision = ${sourceRevision},
            updated_at = now()
        where worksheet_id = ${metadata.worksheetId}
      `;
    } else {
      await sql`
        update dazit_publications
        set has_answer_key = ${metadata.hasAnswerKey},
            pdf_path = ${pdfPath},
            answer_key_pdf_path = ${answerKeyPdfPath},
            thumbnail_paths = ${JSON.stringify(thumbnailPaths)}::jsonb,
            page_count = ${metadata.pages},
            size_bytes = ${pdf.size},
            published_revision = ${sourceRevision},
            updated_at = now()
        where worksheet_id = ${metadata.worksheetId}
      `;
    }
    if (mode !== 'metadata-only') {
      await updateWorksheet(metadata.worksheetId, user!.id, { status: 'published' }, true);
    }
    let learningLink: { token: string; url: string; isPublished: boolean } | null = null;
    if (metadata.documentType === 'Lernkarten') {
      const tokenValue = existingLearningPublication?.token ?? createLearningLinkToken();
      const snapshotToPersist = learningCardsSnapshot
        ?? existingLearningPublication?.snapshot
        ?? null;
      if (snapshotToPersist) {
        const titleValue = learningCardsSnapshot?.title
          || existingLearningPublication?.title
          || metadata.title;
        await sql`
          insert into learning_card_publications (
            worksheet_id,
            token,
            title,
            snapshot,
            is_published,
            published_at,
            updated_at
          ) values (
            ${metadata.worksheetId},
            ${tokenValue},
            ${titleValue},
            ${JSON.stringify(snapshotToPersist)}::jsonb,
            true,
            now(),
            now()
          )
          on conflict (worksheet_id) do update set
            token = excluded.token,
            title = excluded.title,
            snapshot = excluded.snapshot,
            is_published = true,
            updated_at = now()
        `;
        learningLink = {
          token: tokenValue,
          url: `${new URL(request.url).origin}/learn/${tokenValue}`,
          isPublished: true,
        };
      }
    }
    const latestRevisionRows = await sql`
      select source_revision as "sourceRevision"
      from worksheets
      where id = ${metadata.worksheetId}
    ` as Array<{ sourceRevision: string | number }>;
    return NextResponse.json({
      worksheet: manifest,
      publicationStatus: Number(latestRevisionRows[0]?.sourceRevision) === effectivePublishedRevision
        ? 'current'
        : 'outdated',
      learningLink,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publishing failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
