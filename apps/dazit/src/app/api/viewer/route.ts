import { getCurrentDazitUser } from '@/lib/auth/authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentDazitUser();
  return Response.json({
    authenticated: Boolean(user),
    isAdmin: Boolean(user?.isAdmin),
  });
}
