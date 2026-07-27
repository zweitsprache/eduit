import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import {
  createContextProfile,
  deleteContextProfile,
  listContextProfiles,
  updateContextProfile,
} from '@/lib/context-profiles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : 'Context profile request failed.';
  return NextResponse.json({ error: message }, {
    status: /not found/i.test(message) ? 404 : 400,
  });
}

export async function GET() {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    return NextResponse.json({
      profiles: await listContextProfiles(user.id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    return NextResponse.json({
      profile: await createContextProfile(user.id, await request.json()),
    }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const payload = await request.json() as {
      id?: string;
      profile?: unknown;
    };
    if (!payload.id) throw new Error('Context profile ID is required.');
    return NextResponse.json({
      profile: await updateContextProfile(
        payload.id,
        user.id,
        payload.profile,
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new Error('Context profile ID is required.');
    await deleteContextProfile(id, user.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
