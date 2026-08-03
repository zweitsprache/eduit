import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { createWorksheet } from '@/lib/worksheets';
import { worksheetPatchFromGeneratedJson } from '@/lib/worksheet-json-import';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  data: z.unknown(),
  brandProfileId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const { data, brandProfileId } = requestSchema.parse(await request.json());
    const container = data as { schemaVersion?: unknown; worksheet?: unknown; worksheets?: unknown };
    const rawWorksheets = Array.isArray(container?.worksheets)
      ? container.worksheets
      : container?.worksheet
        ? [container.worksheet]
        : [data];
    if (!rawWorksheets.length || rawWorksheets.length > 100) {
      throw new Error('Provide between 1 and 100 worksheets.');
    }
    const patches = rawWorksheets.map((value) => (
      worksheetPatchFromGeneratedJson(value, brandProfileId)
    ));
    const worksheets = [];
    for (const patch of patches) {
      const worksheet = await createWorksheet(user.id, patch);
      worksheets.push({ id: worksheet!.id, title: worksheet!.title });
    }
    return NextResponse.json({ worksheets }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Worksheet JSON import failed.',
    }, { status: 400 });
  }
}
