import { NextResponse } from 'next/server';
import { listWorksheetsForAdmin, type WorksheetAdminListResult } from '@/lib/worksheets';
import { WORKSHEET_STATUSES, type WorksheetStatus } from '@/lib/worksheet-types';
import { getCurrentAppUser } from '@/lib/auth/authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

    const url = new URL(request.url);
    const search = url.searchParams.get('q')?.trim() || undefined;
    const level = url.searchParams.get('level')?.trim() || undefined;
    const actionField = url.searchParams.get('actionField')?.trim() || undefined;
    const statusParam = url.searchParams.get('status')?.trim();
    const status = statusParam && WORKSHEET_STATUSES.includes(statusParam as WorksheetStatus)
      ? statusParam as WorksheetStatus
      : undefined;
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 25;

    const result: WorksheetAdminListResult = await listWorksheetsForAdmin({
      search,
      level,
      actionField,
      status,
      page,
      pageSize,
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load worksheets.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
