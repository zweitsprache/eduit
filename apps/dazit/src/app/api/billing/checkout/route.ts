import { getCurrentDazitUser } from '@/lib/auth/authorization';
import { assertPolarConfigured, polar } from '@/lib/polar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRODUCTS = {
  plus: () => process.env.POLAR_PRODUCT_PLUS,
  unlimited: () => process.env.POLAR_PRODUCT_UNLIMITED,
} as const;

export async function POST(request: Request) {
  const user = await getCurrentDazitUser();
  if (!user) {
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
      externalCustomerId: user.id,
      customerEmail: user.email,
      customerName: user.name,
      successUrl: `${origin}/billing/success`,
      returnUrl: `${origin}/account`,
    });
    return Response.json({ url: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout creation failed.';
    return Response.json({ error: message }, { status: 502 });
  }
}
