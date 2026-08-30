import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { persistPolarState } from '@/lib/dazit-billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: 'Polar webhook is not configured.' }, { status: 503 });
  }

  try {
    const body = await request.text();
    const event = validateEvent(body, Object.fromEntries(request.headers), secret);

    if (event.type === 'customer.state_changed' && event.data.externalId) {
      await persistPolarState(event.data.externalId, event.data);
    }

    return Response.json({ received: true });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return Response.json({ error: 'Invalid webhook signature.' }, { status: 403 });
    }
    console.error('Polar webhook failed', error);
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
