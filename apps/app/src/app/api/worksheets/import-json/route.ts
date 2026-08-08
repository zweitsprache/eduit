import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { getWorksheet, updateWorksheet } from '@/lib/worksheets';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetPatch,
} from '@/lib/worksheet-types';
import {
  generatedWorksheetSchema,
  worksheetPatchFromGeneratedJson,
} from '@/lib/worksheet-json-import';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  id: z.string().min(1),
  data: z.unknown(),
});

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  try {
    const { id, data } = requestSchema.parse(await request.json());
    const current = await getWorksheet(id, user.id, user.isAdmin);
    if (!current) {
      return NextResponse.json({ error: 'Worksheet not found.' }, { status: 404 });
    }

    const container = data as { schemaVersion?: unknown; worksheet?: unknown; worksheets?: unknown };
    const rawWorksheets = Array.isArray(container?.worksheets)
      ? container.worksheets
      : container?.worksheet
        ? [container.worksheet]
        : [data];

    if (rawWorksheets.length !== 1) {
      throw new Error('Provide exactly 1 worksheet.');
    }

    const value = rawWorksheets[0];
    const input = generatedWorksheetSchema.parse(value);

    let patch: WorksheetPatch;
    if (input.sourceWorksheetId) {
      const source = await getWorksheet(input.sourceWorksheetId, user.id, true);
      if (!source) throw new Error(`Source worksheet ${input.sourceWorksheetId} not found.`);
      patch = {
        title: input.title ?? source.title,
        contentHtml: source.contentHtml,
        documentSize: input.documentSize ?? source.documentSize,
        showSolutions: input.showSolutions ?? source.showSolutions,
        status: input.status ?? source.status,
        context: input.context
          ? { ...EMPTY_WORKSHEET_CONTEXT, ...input.context }
          : source.context,
        brandProfileId: input.brandProfileId === undefined
          ? current.brandProfileId
          : input.brandProfileId,
        folderId: input.folderId === undefined
          ? current.folderId
          : input.folderId,
      };
    } else {
      patch = worksheetPatchFromGeneratedJson(value, current.brandProfileId);
      if (input.brandProfileId === undefined) patch.brandProfileId = current.brandProfileId;
      if (input.folderId === undefined) patch.folderId = current.folderId;
    }

    const worksheet = await updateWorksheet(id, user.id, patch, user.isAdmin);
    return NextResponse.json({ worksheet });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Worksheet JSON import failed.',
    }, { status: 400 });
  }
}