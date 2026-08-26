import { NextResponse } from 'next/server';
import { updateWorksheetHeadingText } from '@/lib/worksheets';
import { getCurrentAppUser } from '@/lib/auth/authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const payload = await request.json().catch(() => ({})) as {
      id?: string;
      headingText?: string;
    };
    if (!payload.id) throw new Error('Worksheet ID is required.');
    if (typeof payload.headingText !== 'string') {
      throw new Error('Heading text is required.');
    }
    const headingText = payload.headingText.trim().slice(0, 300);
    const updated = await updateWorksheetHeadingText(
      payload.id,
      user.id,
      headingText,
      user.isAdmin,
    );
    if (!updated) throw new Error('Worksheet not found.');
    return NextResponse.json({ headingText, updatedAt: updated.updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save heading.';
    return NextResponse.json({ error: message }, {
      status: /not found|no h1 heading/i.test(message) ? 404 : 400,
    });
  }
}
