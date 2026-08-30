import { getCurrentDazitUser } from '@/lib/auth/authorization';
import { syncPolarState } from '@/lib/dazit-billing';

export async function GET(request: Request) {
  const user = await getCurrentDazitUser();
  if (user) {
    await syncPolarState(user.id).catch((error) => {
      console.error('Post-checkout Polar sync failed', error);
    });
  }
  return Response.redirect(new URL('/account', request.url));
}
