import { auth } from '@/lib/auth/server';
import { syncPolarState } from '@/lib/billing';

export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (session?.user) {
    await syncPolarState(session.user.id).catch((error) => {
      console.error('Post-checkout Polar sync failed', error);
    });
  }
  return Response.redirect(new URL('/account', request.url));
}
