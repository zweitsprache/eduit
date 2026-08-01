import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { sql } from '@/lib/neon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const relationshipTypes = [
  'word_grid_from_verb_table',
  'conjugation_exercise_from_verb_table',
] as const;

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const input = await request.json() as {
      sourceWorksheetId?: string;
      relatedWorksheetId?: string;
      relationshipType?: typeof relationshipTypes[number];
    };
    if (
      !input.sourceWorksheetId
      || !input.relatedWorksheetId
      || !relationshipTypes.includes(input.relationshipType as never)
    ) {
      return NextResponse.json({ error: 'Invalid worksheet relationship.' }, { status: 400 });
    }
    const worksheets = await sql`
      select id, source_revision as "sourceRevision"
      from worksheets
      where id in (${input.sourceWorksheetId}, ${input.relatedWorksheetId})
        and owner_user_id = ${user.id}
    ` as Array<{ id: string; sourceRevision: number }>;
    if (worksheets.length !== 2) {
      return NextResponse.json({ error: 'Worksheet not found.' }, { status: 404 });
    }
    const source = worksheets.find(({ id }) => id === input.sourceWorksheetId);
    if (!source) return NextResponse.json({ error: 'Source worksheet not found.' }, { status: 404 });
    const rows = await sql`
      insert into worksheet_relationships (
        source_worksheet_id,
        related_worksheet_id,
        relationship_type,
        source_revision
      ) values (
        ${input.sourceWorksheetId},
        ${input.relatedWorksheetId},
        ${input.relationshipType},
        ${source.sourceRevision}
      )
      on conflict (source_worksheet_id, related_worksheet_id) do update set
        relationship_type = excluded.relationship_type,
        source_revision = excluded.source_revision
      returning id
    `;
    return NextResponse.json({ relationship: rows[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Could not save worksheet relationship.',
    }, { status: 400 });
  }
}
