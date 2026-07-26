import { NextResponse } from 'next/server';
import {
  createBrandProfile,
  deleteBrandProfile,
  listBrandProfiles,
  updateBrandProfile,
  validateBrandProfileInput,
} from '@/lib/brand-profiles';

export const runtime = 'nodejs';

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Brand profile request failed.';
  const conflict = /unique|duplicate/i.test(message);
  return NextResponse.json({ error: conflict ? 'That brand slug is already in use.' : message }, {
    status: conflict ? 409 : 400,
  });
}

export async function GET() {
  try {
    return NextResponse.json({ profiles: await listBrandProfiles() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = validateBrandProfileInput(await request.json());
    return NextResponse.json({ profile: await createBrandProfile(input) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json() as { id?: string; profile?: unknown };
    if (!payload.id) throw new Error('Brand profile ID is required.');
    const input = validateBrandProfileInput(payload.profile);
    return NextResponse.json({ profile: await updateBrandProfile(payload.id, input) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new Error('Brand profile ID is required.');
    await deleteBrandProfile(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
