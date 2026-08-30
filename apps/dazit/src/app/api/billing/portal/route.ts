import { getCurrentDazitUser } from '@/lib/auth/authorization';
import { getBillingState } from '@/lib/dazit-billing';
import { assertPolarConfigured, polar } from '@/lib/polar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getCurrentDazitUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const billing = await getBillingState(user.id);
  if (!billing.polar_customer_id) {
    return Response.json({ error: 'No subscription found.' }, { status: 404 });
  }

  try {
    assertPolarConfigured();
    const session = await polar.customerSessions.create({
      customerId: billing.polar_customer_id,
    });
    return Response.json({ url: session.customerPortalUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Portal session creation failed.';
    return Response.json({ error: message }, { status: 502 });
  }
}
