import { neon } from '@neondatabase/serverless';

export type DazitPublicationDocumentType =
  | 'Arbeitsblatt'
  | 'Merkblatt'
  | 'Verbtabelle'
  | 'Deklinationstabelle'
  | 'Lernkarten'
  | 'Dialog'
  | 'Leseverstehen';

export type DazitPublicationRow = {
  worksheetId: string;
  slug: string;
  title: string;
  documentType: DazitPublicationDocumentType;
  pdfPath: string;
  thumbnailPaths: string[];
  pageCount: number;
  sizeBytes: number;
  publishedAt: string;
  updatedAt: string;
  excerpt: string | null;
  searchSnippet: string | null;
  descriptionHtml: string | null;
  tags: string[];
  level: string | null;
  actionCompetencies: string[];
  languageCompetencies: string[];
  actionCompetencyContributionHtml: string | null;
  actionField: string | null;
  downloads: number;
  showSolutions: boolean;
  context: Record<string, unknown> | null;
};

export type DazitPublicationCardRow = {
  worksheetId: string;
  slug: string;
  title: string;
  documentType: DazitPublicationDocumentType;
  pdfPath: string;
  thumbnailPaths: string[];
  pageCount: number;
  sizeBytes: number;
  publishedAt: string;
  excerpt: string | null;
  tags: string[];
  level: string | null;
  downloads: number;
  showSolutions: boolean;
  context: null;
};

export type DazitHomepageStatsRow = {
  total: number;
  levelCounts: Record<string, number>;
  typeCounts: Record<string, number>;
};

export async function getDazitSearchStats() {
  if (!process.env.DATABASE_URL) return { popular: [], zeroResults: [] };
  const sql = neon(process.env.DATABASE_URL);
  try {
    const [popular, zeroResults] = await Promise.all([
      sql`select query, count(*)::int as searches, max(created_at) as "lastSearched"
        from dazit_search_events where created_at > now() - interval '12 months'
        group by query order by searches desc, "lastSearched" desc limit 100`,
      sql`select query, count(*)::int as searches, max(created_at) as "lastSearched"
        from dazit_search_events where result_count = 0 and created_at > now() - interval '12 months'
        group by query order by searches desc, "lastSearched" desc limit 100`,
    ]);
    return { popular, zeroResults };
  } catch (error) {
    console.error('Could not load Dazit search statistics.', error);
    return { popular: [], zeroResults: [] };
  }
}

export type DazitPublicationMetadata = {
  worksheetId: string;
  title: string;
  documentType: DazitPublicationDocumentType;
  descriptionHtml: string | null;
  excerpt: string | null;
  searchSnippet: string | null;
  tags: string[];
  level: string | null;
  actionCompetencies: string[];
  languageCompetencies: string[];
  actionCompetencyContributionHtml: string | null;
  actionField: string | null;
  downloads: number;
  relationships: DazitPublicationRelationship[];
};

export type DazitPublicationRelationship = {
  worksheetId: string;
  slug: string;
  title: string;
  documentType: string;
  relationshipType: 'word_grid_from_verb_table' | 'conjugation_exercise_from_verb_table';
  role: 'member';
};

export async function getPublicationMetadata() {
  if (!process.env.DATABASE_URL) return new Map<string, DazitPublicationMetadata>();
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    select
      worksheet_id as "worksheetId",
      title,
      document_type as "documentType",
      description_html as "descriptionHtml",
      excerpt,
      search_snippet as "searchSnippet",
      tags,
      level,
      action_competencies as "actionCompetencies",
      language_competencies as "languageCompetencies",
      action_competency_contribution_html as "actionCompetencyContributionHtml"
      , action_field as "actionField"
      , download_count::int as downloads
    from dazit_publications
  ` as DazitPublicationMetadata[];
  const metadata = new Map<string, DazitPublicationMetadata>(rows.map((row) => [row.worksheetId, {
    ...row,
    relationships: [],
  }]));
  const relationships = await sql`
    select
      relationship.source_worksheet_id as "sourceWorksheetId",
      relationship.related_worksheet_id as "relatedWorksheetId",
      relationship.relationship_type as "relationshipType",
      source.slug as "sourceSlug",
      source.title as "sourceTitle",
      source.document_type as "sourceDocumentType",
      related.slug as "relatedSlug",
      related.title as "relatedTitle",
      related.document_type as "relatedDocumentType"
    from worksheet_relationships relationship
    join dazit_publications source
      on source.worksheet_id = relationship.source_worksheet_id
    join dazit_publications related
      on related.worksheet_id = relationship.related_worksheet_id
  ` as Array<{
    sourceWorksheetId: string;
    relatedWorksheetId: string;
    relationshipType: DazitPublicationRelationship['relationshipType'];
    sourceSlug: string;
    sourceTitle: string;
    sourceDocumentType: string;
    relatedSlug: string;
    relatedTitle: string;
    relatedDocumentType: string;
  }>;
  const families = Map.groupBy(
    relationships,
    ({ sourceWorksheetId }) => sourceWorksheetId,
  );
  families.forEach((family) => {
    const members = [
      {
        worksheetId: family[0].sourceWorksheetId,
        slug: family[0].sourceSlug,
        title: family[0].sourceTitle,
        documentType: family[0].sourceDocumentType,
        relationshipType: family[0].relationshipType,
      },
      ...family.map((relationship) => ({
        worksheetId: relationship.relatedWorksheetId,
        slug: relationship.relatedSlug,
        title: relationship.relatedTitle,
        documentType: relationship.relatedDocumentType,
        relationshipType: relationship.relationshipType,
      })),
    ];
    members.forEach((member) => {
      const record = metadata.get(member.worksheetId);
      if (!record) return;
      record.relationships = members
        .filter(({ worksheetId }) => worksheetId !== member.worksheetId)
        .map((related) => ({ ...related, role: 'member' }));
    });
  });
  return metadata;
}

export async function getPublishedWorksheetsFromDb() {
  if (!process.env.DATABASE_URL) return [] as DazitPublicationRow[];
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    select
      p.worksheet_id as "worksheetId",
      p.slug,
      p.title,
      p.document_type as "documentType",
      p.pdf_path as "pdfPath",
      p.thumbnail_paths as "thumbnailPaths",
      p.page_count as "pageCount",
      p.size_bytes as "sizeBytes",
      p.published_at as "publishedAt",
      p.updated_at as "updatedAt",
      p.excerpt,
      p.search_snippet as "searchSnippet",
      p.description_html as "descriptionHtml",
      p.tags,
      p.level,
      p.action_competencies as "actionCompetencies",
      p.language_competencies as "languageCompetencies",
      p.action_competency_contribution_html as "actionCompetencyContributionHtml",
      p.action_field as "actionField",
      p.download_count::int as downloads,
      w.show_solutions as "showSolutions",
      w.context
    from dazit_publications p
    join worksheets w on w.id = p.worksheet_id
    order by p.published_at desc
  ` as DazitPublicationRow[];
  return rows;
}

export async function getPublishedWorksheetCardsFromDb() {
  if (!process.env.DATABASE_URL) return [] as DazitPublicationCardRow[];
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    select
      p.worksheet_id as "worksheetId",
      p.slug,
      p.title,
      p.document_type as "documentType",
      p.pdf_path as "pdfPath",
      case when jsonb_typeof(p.thumbnail_paths) = 'array' and jsonb_array_length(p.thumbnail_paths) > 0
        then jsonb_build_array(p.thumbnail_paths->0) else '[]'::jsonb end as "thumbnailPaths",
      p.page_count as "pageCount",
      p.size_bytes as "sizeBytes",
      p.published_at as "publishedAt",
      p.excerpt,
      p.tags,
      p.level,
      p.download_count::int as downloads,
      w.show_solutions as "showSolutions",
      null as context
    from dazit_publications p
    join worksheets w on w.id = p.worksheet_id
    order by p.published_at desc
  ` as DazitPublicationCardRow[];
  return rows;
}

export async function getDazitHomepageStatsFromDb() {
  if (!process.env.DATABASE_URL) {
    return {
      total: 0,
      levelCounts: {},
      typeCounts: {},
    } satisfies DazitHomepageStatsRow;
  }
  const sql = neon(process.env.DATABASE_URL);
  const [counts] = await sql`
    with publication_base as (
      select
        level,
        document_type as "documentType"
      from dazit_publications
    )
    select
      (select count(*)::int from publication_base) as total,
      coalesce((
        select jsonb_object_agg(level, count)
        from (
          select level, count(*)::int as count
          from publication_base
          where level is not null
          group by level
        ) level_counts
      ), '{}'::jsonb) as "levelCounts",
      coalesce((
        select jsonb_object_agg("documentType", count)
        from (
          select "documentType", count(*)::int as count
          from publication_base
          group by "documentType"
        ) type_counts
      ), '{}'::jsonb) as "typeCounts"
  ` as Array<DazitHomepageStatsRow>;
  return counts ?? {
    total: 0,
    levelCounts: {},
    typeCounts: {},
  };
}

export async function incrementPublicationDownload(worksheetId: string) {
  if (!process.env.DATABASE_URL) return;
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    update dazit_publications
    set download_count = download_count + 1
    where worksheet_id = ${worksheetId}
  `;
}
