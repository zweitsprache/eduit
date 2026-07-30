import { getCurrentAppUser } from '@/lib/auth/authorization';

export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  return Response.json({ role: user.role });
}
