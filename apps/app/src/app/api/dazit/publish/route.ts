import { get, put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { updateWorksheet } from '@/lib/worksheets';
import { sql } from '@/lib/neon';
import { dazitMetadataModel } from '@/lib/ai';
import { germanProgressionDetectionReference } from '@/lib/german-language-progression';

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
  documentType: 'Arbeitsblatt' | 'Merkblatt' | 'Verbtabelle' | 'Deklinationstabelle' | 'Lernkarten' | 'Domino';
  pages: number;
  language: string;
  difficulty: string;
  hasAnswerKey: boolean;
  tags: string[];
};

const forbiddenAdultDazTerminology =
  /unterricht|schule|schul|kinder|jugendliche|klassenzimmer|klassenstufe|lehrperson|lehrer|schüler|regeldaz|(?:^|[^A-Za-zÄÖÜäöüß])DaF(?:$|[^A-Za-zÄÖÜäöüß])/i;
const irrelevantProductionLanguage =
  /doppelseitig|kurze(?:n|r)? seite|spiegeln|schneide(?:linie|marke)|drucktechnisch|druckhinweis|seitenumbruch|seitenzahl|der hinweis.+zeigt|das (?:pdf|dokument).+(?:zeigt|weist darauf hin)|die vorlage.+konzipiert/i;

const descriptionSchema = z.object({
  excerpt: z.string().trim().min(120).max(280),
  searchSnippet: z.string().trim().min(90).max(180),
  tags: z.array(z.string().trim().min(2).max(50)).min(1).max(10),
  level: z.enum(['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2']),
  actionCompetencies: z.array(z.enum([
    'Lesen',
    'Hören',
    'Monologisches Sprechen',
    'Dialogisches Sprechen',
    'Monologisches Schreiben',
    'Dialogisches Schreiben',
  ])).max(3),
  languageCompetencies: z.array(z.enum([
    'Wortschatz',
    'Grammatik',
    'Aussprache',
    'Intonation',
    'Orthografie',
  ])).min(1).max(5),
  actionField: z.enum([
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
  ]).nullable(),
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

async function generateDescription(pdf: File, metadata: PublishMetadata) {
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
4. Bestimme genau ein Niveau von A1.1 bis B1.2. Nutze ausschliesslich die unten
   stehenden Progressionsdeskriptoren. Ordne das Dokument dem frühesten Niveau
   zu, auf dem seine zentralen sprachlichen Strukturen verfügbar sind. Beurteile
   nicht nur die sichtbare Textmenge oder das Layout.
5. Bestimme die Sprachhandlungskompetenz nur, wenn das Dokument eine konkrete
   rezeptive oder produktive Sprachhandlung erkennbar unterstützt. Gib sonst
   eine leere Liste zurück. Eine Grammatik- oder Verbtabelle allein ist keine
   Sprachhandlung und darf nicht automatisch Lesen oder Schreiben zugeordnet
   werden.
6. Bestimme alle unmittelbar behandelten Sprachkompetenzen.
7. Beschreibe im Beitrag zur Sprachhandlungskompetenz knapp und sachlich, wie der sprachliche
   Inhalt die Handlungsfähigkeit erwachsener Lernender erweitert. Beschreibe
   ausdrücklich nicht bloss die Fertigkeit, das Aufgabenformat oder die
   Tabellenstruktur. Beispiel Modalverben: Lernende können ausdrücken, was sie
   können, müssen, dürfen oder möchten. Nenne konkrete kommunikative
   Verwendungsmöglichkeiten, die aus dem PDF belegbar sind. Die
   Text umfasst mindestens 100 Zeichen. Generiere keine Beispielsätze,
   Musterformulierungen, Dialogbeispiele oder Listen mit möglichen Äusserungen.
8. Ordne höchstens ein Handlungsfeld aus der folgenden geschlossenen Liste zu:
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

Verbindliche Progressionsdeskriptoren:
${germanProgressionDetectionReference()}

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
    const descriptiveText = JSON.stringify({
      excerpt: output.excerpt,
      searchSnippet: output.searchSnippet,
      introduction: output.introduction,
      sections: output.sections,
      contribution: output.actionCompetencyContribution,
    });
    const missingLearningCardReference = metadata.documentType === 'Lernkarten'
      && (
        !/Lernkarten/i.test(output.excerpt)
        || !/Lernkarten/i.test(output.searchSnippet)
        || !/Lernkarten/i.test(JSON.stringify({
          introduction: output.introduction,
          sections: output.sections,
        }))
      );
    if (
      !forbiddenAdultDazTerminology.test(descriptiveText)
      && !irrelevantProductionLanguage.test(descriptiveText)
      && !missingLearningCardReference
    ) break;
  }
  if (!output) throw new Error('Description generation failed.');
  const generatedText = JSON.stringify({
    excerpt: output.excerpt,
    searchSnippet: output.searchSnippet,
    introduction: output.introduction,
    sections: output.sections,
    contribution: output.actionCompetencyContribution,
  });
  const missingLearningCardReference = metadata.documentType === 'Lernkarten'
    && (
      !/Lernkarten/i.test(output.excerpt)
      || !/Lernkarten/i.test(output.searchSnippet)
      || !/Lernkarten/i.test(JSON.stringify({
        introduction: output.introduction,
        sections: output.sections,
      }))
    );
  if (
    forbiddenAdultDazTerminology.test(generatedText)
    || irrelevantProductionLanguage.test(generatedText)
    || missingLearningCardReference
  ) {
    throw new Error(
      'The generated description did not follow the adult DaZ terminology rules. Please publish again.',
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
    tags: [...new Set(output.tags.map((tag) => tag.trim()))].slice(0, 10),
    level: output.level,
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
    const token = process.env.DAZIT_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Dazit publishing is not configured. Add DAZIT_BLOB_READ_WRITE_TOKEN to the editor environment.' },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const pdf = formData.get('pdf');
    const metadataValue = formData.get('metadata');
    const requestedMode = formData.get('mode');
    const mode = requestedMode === 'pdf-only' || requestedMode === 'metadata-only'
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
    if (!metadata.worksheetId || !metadata.slug || !metadata.title) {
      return NextResponse.json({ error: 'Invalid worksheet metadata.' }, { status: 400 });
    }
    const documentTypes = ['Arbeitsblatt', 'Merkblatt', 'Verbtabelle', 'Deklinationstabelle', 'Lernkarten', 'Domino'];
    if (!documentTypes.includes(metadata.documentType)) {
      return NextResponse.json({ error: 'Invalid Dazit document type.' }, { status: 400 });
    }
    if (mode !== 'metadata-only' && (!thumbnails.length || thumbnails.length !== metadata.pages)) {
      return NextResponse.json({ error: 'One thumbnail per PDF page is required.' }, { status: 400 });
    }
    const revisionRows = await sql`
      select source_revision as "sourceRevision"
      from worksheets
      where id = ${metadata.worksheetId}
    ` as Array<{ sourceRevision: string | number }>;
    if (!revisionRows[0]) {
      return NextResponse.json({ error: 'Worksheet not found.' }, { status: 404 });
    }
    const sourceRevision = Number(revisionRows[0].sourceRevision);
    const publicationRows = await sql`
      select
        worksheet_id as "worksheetId",
        pdf_path as "pdfPath",
        thumbnail_paths as "thumbnailPaths",
        size_bytes as "sizeBytes"
      from dazit_publications
      where worksheet_id = ${metadata.worksheetId}
    ` as Array<{
      worksheetId: string;
      pdfPath: string;
      thumbnailPaths: string[];
      sizeBytes: number;
    }>;
    if (mode !== 'full' && !publicationRows[0]) {
      return NextResponse.json(
        { error: 'This publishing mode requires an existing Dazit publication.' },
        { status: 400 },
      );
    }
    const description = mode !== 'pdf-only'
      ? await generateDescription(pdf, metadata)
      : null;

    const pdfPath = mode === 'metadata-only'
      ? publicationRows[0].pdfPath
      : `worksheets/${metadata.worksheetId}/${metadata.slug}.pdf`;
    if (mode !== 'metadata-only') {
      await put(pdfPath, pdf, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/pdf',
        token,
      });
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
      actionCompetencies: description.actionCompetencies,
      languageCompetencies: description.languageCompetencies,
      actionField: description.actionField,
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
        pdf_path,
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
        ${pdfPath},
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
        ${description.actionCompetencyContributionHtml},
        ${description.actionField},
        3,
        ${sourceRevision},
        now(),
        now()
      )
      on conflict (worksheet_id) do update set
        slug = excluded.slug,
        title = excluded.title,
        document_type = excluded.document_type,
        pdf_path = excluded.pdf_path,
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
        action_competency_contribution_html = excluded.action_competency_contribution_html,
        action_field = excluded.action_field,
        metadata_version = excluded.metadata_version,
        published_revision = excluded.published_revision,
        updated_at = now()
      `;
    } else {
      await sql`
        update dazit_publications
        set pdf_path = ${pdfPath},
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
    const latestRevisionRows = await sql`
      select source_revision as "sourceRevision"
      from worksheets
      where id = ${metadata.worksheetId}
    ` as Array<{ sourceRevision: string | number }>;
    return NextResponse.json({
      worksheet: manifest,
      publicationStatus: Number(latestRevisionRows[0]?.sourceRevision) === sourceRevision
        ? 'current'
        : 'outdated',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publishing failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
