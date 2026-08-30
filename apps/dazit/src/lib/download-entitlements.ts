import { neon } from '@neondatabase/serverless';
import { getBillingState, type Tier } from '@/lib/dazit-billing';

export const FREE_DAILY_DOWNLOAD_LIMIT = 1;
export const PLUS_MONTHLY_DOWNLOAD_LIMIT = 60;

export type DownloadAssetKind = 'worksheet' | 'answer_key';

export type PeriodKind = 'day' | 'month';

export type DownloadEntitlement = {
  allowed: boolean;
  tier: Tier;
  periodKind: PeriodKind | null;
  limit: number | null;
  remaining: number | null;
  resetsAt: string | null;
};

type EntitlementRow = {
  allowed: boolean;
  remaining: number;
  resetsAt: Date | string;
};

async function consumeWindowedDownload({
  assetKind,
  userId,
  worksheetId,
  entitlementSource,
  limit,
  periodKind,
}: {
  assetKind: DownloadAssetKind;
  userId: string;
  worksheetId: string;
  entitlementSource: 'free_daily' | 'subscription';
  limit: number;
  periodKind: PeriodKind;
}): Promise<{ allowed: boolean; remaining: number; resetsAt: string }> {
  const sql = neon(process.env.DATABASE_URL!);
  const dateTrunc = periodKind === 'month' ? 'month' : 'day';
  const rows = await sql`
    with download_day as materialized (
      select (now() at time zone 'Europe/Zurich')::date as usage_date,
        date_trunc(${dateTrunc}, (now() at time zone 'Europe/Zurich'))::date as period_start
    ), entitlement_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended(${userId} || ':' || ${entitlementSource} || ':' || period_start::text, 0)
      )
      from download_day
    ), current_usage as materialized (
      select coalesce(sum(consumption.units), 0)::int as used
      from entitlement_lock
      cross join download_day
      left join app.download_consumption consumption
        on consumption.user_id = ${userId}
        and consumption.entitlement_source = ${entitlementSource}
        and date_trunc(${dateTrunc}, consumption.usage_date) = download_day.period_start
    ), inserted as (
      insert into app.download_consumption (
        user_id,
        worksheet_id,
        asset_kind,
        entitlement_source,
        units,
        usage_date
      )
      select
        ${userId},
        ${worksheetId}::uuid,
        ${assetKind},
        ${entitlementSource},
        1,
        download_day.usage_date
      from download_day
      cross join current_usage
      where current_usage.used < ${limit}
      returning units
    )
    select
      exists(select 1 from inserted) as allowed,
      greatest(
        ${limit} - current_usage.used
          - coalesce((select sum(units) from inserted), 0),
        0
      )::int as remaining,
      (
        case
          when ${periodKind} = 'month'
            then (download_day.period_start + interval '1 month')
          else (download_day.period_start + interval '1 day')
        end at time zone 'Europe/Zurich'
      ) as "resetsAt"
    from download_day
    cross join current_usage
  ` as EntitlementRow[];

  const entitlement = rows[0];
  if (!entitlement) throw new Error('Download entitlement could not be determined.');

  return {
    allowed: entitlement.allowed,
    remaining: entitlement.remaining,
    resetsAt: new Date(entitlement.resetsAt).toISOString(),
  };
}

export async function consumeDownloadEntitlement({
  assetKind,
  userId,
  worksheetId,
}: {
  assetKind: DownloadAssetKind;
  userId: string;
  worksheetId: string;
}): Promise<DownloadEntitlement> {
  if (!process.env.DATABASE_URL) {
    throw new Error('Dazit database is not configured.');
  }

  const billing = await getBillingState(userId);

  if (billing.tier === 'unlimited') {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      insert into app.download_consumption (
        user_id,
        worksheet_id,
        asset_kind,
        entitlement_source,
        units,
        usage_date
      )
      values (
        ${userId},
        ${worksheetId}::uuid,
        ${assetKind},
        'subscription',
        1,
        (now() at time zone 'Europe/Zurich')::date
      )
    `;
    return {
      allowed: true,
      tier: 'unlimited',
      periodKind: null,
      limit: null,
      remaining: null,
      resetsAt: null,
    };
  }

  if (billing.tier === 'plus') {
    const result = await consumeWindowedDownload({
      assetKind,
      userId,
      worksheetId,
      entitlementSource: 'subscription',
      limit: PLUS_MONTHLY_DOWNLOAD_LIMIT,
      periodKind: 'month',
    });
    return {
      ...result,
      tier: 'plus',
      periodKind: 'month',
      limit: PLUS_MONTHLY_DOWNLOAD_LIMIT,
    };
  }

  const result = await consumeWindowedDownload({
    assetKind,
    userId,
    worksheetId,
    entitlementSource: 'free_daily',
    limit: FREE_DAILY_DOWNLOAD_LIMIT,
    periodKind: 'day',
  });
  return {
    ...result,
    tier: 'free',
    periodKind: 'day',
    limit: FREE_DAILY_DOWNLOAD_LIMIT,
  };
}

export type CurrentUsage = {
  tier: Tier;
  used: number;
  limit: number | null;
  periodKind: PeriodKind | null;
  resetsAt: string | null;
};

export async function getCurrentUsage(userId: string): Promise<CurrentUsage> {
  const billing = await getBillingState(userId);

  if (billing.tier === 'unlimited') {
    return { tier: 'unlimited', used: 0, limit: null, periodKind: null, resetsAt: null };
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('Dazit database is not configured.');
  }
  const sql = neon(process.env.DATABASE_URL);
  const entitlementSource = billing.tier === 'plus' ? 'subscription' : 'free_daily';
  const dateTrunc = billing.tier === 'plus' ? 'month' : 'day';
  const limit = billing.tier === 'plus' ? PLUS_MONTHLY_DOWNLOAD_LIMIT : FREE_DAILY_DOWNLOAD_LIMIT;
  const periodKind: PeriodKind = billing.tier === 'plus' ? 'month' : 'day';

  const rows = await sql`
    with download_day as materialized (
      select date_trunc(${dateTrunc}, (now() at time zone 'Europe/Zurich'))::date as period_start
    )
    select
      coalesce(sum(consumption.units), 0)::int as used,
      (
        case
          when ${periodKind} = 'month'
            then (download_day.period_start + interval '1 month')
          else (download_day.period_start + interval '1 day')
        end at time zone 'Europe/Zurich'
      ) as "resetsAt"
    from download_day
    left join app.download_consumption consumption
      on consumption.user_id = ${userId}
      and consumption.entitlement_source = ${entitlementSource}
      and date_trunc(${dateTrunc}, consumption.usage_date) = download_day.period_start
    group by download_day.period_start
  ` as Array<{ used: number; resetsAt: Date | string }>;

  const row = rows[0];
  return {
    tier: billing.tier,
    used: row?.used ?? 0,
    limit,
    periodKind,
    resetsAt: row ? new Date(row.resetsAt).toISOString() : null,
  };
}