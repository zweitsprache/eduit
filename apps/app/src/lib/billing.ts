import type { CustomerState } from '@polar-sh/sdk/models/components/customerstate';
import { sql } from '@/lib/neon';
import { assertPolarConfigured, polar } from '@/lib/polar';

export type Tier = 'free' | 'pro' | 'scale';

const TIER_RANK: Record<Tier, number> = { free: 0, pro: 1, scale: 2 };

function productTier(productId: string): Tier | undefined {
  if (productId === process.env.POLAR_PRODUCT_SCALE) return 'scale';
  if (productId === process.env.POLAR_PRODUCT_PRO) return 'pro';
  return undefined;
}

export function deriveTier(state: CustomerState): Tier {
  return state.activeSubscriptions
    .map((subscription) => productTier(subscription.productId))
    .filter((tier): tier is Tier => Boolean(tier))
    .sort((left, right) => TIER_RANK[right] - TIER_RANK[left])[0] ?? 'free';
}

export async function persistPolarState(userId: string, state: CustomerState) {
  const tier = deriveTier(state);
  const subscription = state.activeSubscriptions
    .slice()
    .sort((left, right) => TIER_RANK[productTier(right.productId) ?? 'free']
      - TIER_RANK[productTier(left.productId) ?? 'free'])[0];

  await sql`
    insert into app.billing_state (
      user_id,
      polar_customer_id,
      tier,
      subscription_status,
      current_period_end,
      raw_state,
      updated_at
    )
    values (
      ${userId},
      ${state.id},
      ${tier},
      ${subscription?.status ?? null},
      ${subscription?.currentPeriodEnd ?? null},
      ${JSON.stringify(state)},
      now()
    )
    on conflict (user_id) do update set
      polar_customer_id = excluded.polar_customer_id,
      tier = excluded.tier,
      subscription_status = excluded.subscription_status,
      current_period_end = excluded.current_period_end,
      raw_state = excluded.raw_state,
      updated_at = now()
  `;

  const activeMeterIds: string[] = [];
  for (const meter of state.activeMeters) {
    activeMeterIds.push(meter.meterId);
    await sql`
      insert into app.billing_meter (user_id, meter_id, balance, updated_at)
      values (${userId}, ${meter.meterId}, ${meter.balance}, now())
      on conflict (user_id, meter_id) do update set
        balance = excluded.balance,
        updated_at = now()
    `;
  }

  if (activeMeterIds.length === 0) {
    await sql`delete from app.billing_meter where user_id = ${userId}`;
  } else {
    await sql`
      delete from app.billing_meter
      where user_id = ${userId}
        and not (meter_id = any(${activeMeterIds}))
    `;
  }
}

export async function syncPolarState(userId: string) {
  assertPolarConfigured();
  const state = await polar.customers.getStateExternal({ externalId: userId });
  await persistPolarState(userId, state);
  return state;
}

export async function getBillingState(userId: string) {
  const rows = await sql`
    select tier, subscription_status, current_period_end, updated_at
    from app.billing_state
    where user_id = ${userId}
  ` as Array<{
    tier: Tier;
    subscription_status: string | null;
    current_period_end: Date | string | null;
    updated_at: Date | string;
  }>;

  return rows[0] ?? {
    tier: 'free' as const,
    subscription_status: null,
    current_period_end: null,
    updated_at: null,
  };
}

export async function requireTier(userId: string, minimum: Tier) {
  const state = await getBillingState(userId);
  if (TIER_RANK[state.tier] < TIER_RANK[minimum]) {
    throw new Error('upgrade_required');
  }
}
