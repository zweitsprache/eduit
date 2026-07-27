import { auth } from '@/lib/auth/server';
import { assertPolarConfigured, polar } from '@/lib/polar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRODUCTS = {
  pro: () => process.env.POLAR_PRODUCT_PRO,
  scale: () => process.env.POLAR_PRODUCT_SCALE,
} as const;

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { tier?: keyof typeof PRODUCTS };
  const productId = body.tier ? PRODUCTS[body.tier]?.() : undefined;
  if (!productId) {
    return Response.json({ error: 'Unknown or unconfigured product.' }, { status: 400 });
  }

  try {
    assertPolarConfigured();
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const checkout = await polar.checkouts.create({
      products: [productId],
      externalCustomerId: session.user.id,
      customerEmail: session.user.email,
      customerName: session.user.name,
      successUrl: `${origin}/billing/success`,
      returnUrl: `${origin}/account`,
    });
    return Response.json({ url: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout creation failed.';
    return Response.json({ error: message }, { status: 502 });
  }
}
