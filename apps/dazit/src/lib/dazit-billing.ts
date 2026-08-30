import { neon } from '@neondatabase/serverless';
import type { CustomerState } from '@polar-sh/sdk/models/components/customerstate';
import { assertPolarConfigured, polar } from '@/lib/polar';

export type Tier = 'free' | 'plus' | 'unlimited';

const TIER_RANK: Record<Tier, number> = { free: 0, plus: 1, unlimited: 2 };

function productTier(productId: string): Tier | undefined {
  if (productId === process.env.POLAR_PRODUCT_UNLIMITED) return 'unlimited';
  if (productId === process.env.POLAR_PRODUCT_PLUS) return 'plus';
  return undefined;
}

export function deriveTier(state: CustomerState): Tier {
  return state.activeSubscriptions
    .map((subscription) => productTier(subscription.productId))
    .filter((tier): tier is Tier => Boolean(tier))
    .sort((left, right) => TIER_RANK[right] - TIER_RANK[left])[0] ?? 'free';
}

export async function persistPolarState(userId: string, state: CustomerState) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Dazit database is not configured.');
  }

  const tier = deriveTier(state);
  const subscription = state.activeSubscriptions
    .slice()
    .sort((left, right) => TIER_RANK[productTier(right.productId) ?? 'free']
      - TIER_RANK[productTier(left.productId) ?? 'free'])[0];

  const sql = neon(process.env.DATABASE_URL);
  await sql`
    insert into app.dazit_billing_state (
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
}

export async function syncPolarState(userId: string) {
  assertPolarConfigured();
  const state = await polar.customers.getStateExternal({ externalId: userId });
  await persistPolarState(userId, state);
  return state;
}

export type BillingState = {
  tier: Tier;
  polar_customer_id: string | null;
  subscription_status: string | null;
  current_period_end: Date | string | null;
  updated_at: Date | string | null;
};

export async function getBillingState(userId: string): Promise<BillingState> {
  if (!process.env.DATABASE_URL) {
    return {
      tier: 'free',
      polar_customer_id: null,
      subscription_status: null,
      current_period_end: null,
      updated_at: null,
    };
  }

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    select polar_customer_id, tier, subscription_status, current_period_end, updated_at
    from app.dazit_billing_state
    where user_id = ${userId}
  ` as BillingState[];

  return rows[0] ?? {
    tier: 'free',
    polar_customer_id: null,
    subscription_status: null,
    current_period_end: null,
    updated_at: null,
  };
}
