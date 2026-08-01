import { neon } from '@neondatabase/serverless';

export type DazitPublicationMetadata = {
  worksheetId: string;
  title: string;
  documentType: 'Arbeitsblatt' | 'Merkblatt' | 'Verbtabelle' | 'Deklinationstabelle' | 'Lernkarten';
  descriptionHtml: string | null;
  excerpt: string | null;
  tags: string[];
  level: string | null;
  actionCompetencies: string[];
  languageCompetencies: string[];
  actionCompetencyContributionHtml: string | null;
  actionField: string | null;
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
      tags,
      level,
      action_competencies as "actionCompetencies",
      language_competencies as "languageCompetencies",
      action_competency_contribution_html as "actionCompetencyContributionHtml"
      , action_field as "actionField"
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
