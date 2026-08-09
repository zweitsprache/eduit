import { neon } from '@neondatabase/serverless';

export const FREE_DAILY_DOWNLOAD_LIMIT = 3;

export type DownloadAssetKind = 'worksheet' | 'answer_key';

export type DownloadEntitlement = {
  allowed: boolean;
  remaining: number;
  resetsAt: string;
};

type EntitlementRow = {
  allowed: boolean;
  remaining: number;
  resetsAt: Date | string;
};

export async function consumeFreeDownload({
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

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    with download_day as materialized (
      select (now() at time zone 'Europe/Zurich')::date as usage_date
    ), entitlement_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended(${userId} || ':' || usage_date::text, 0)
      )
      from download_day
    ), current_usage as materialized (
      select coalesce(sum(consumption.units), 0)::int as used
      from entitlement_lock
      cross join download_day
      left join app.download_consumption consumption
        on consumption.user_id = ${userId}
        and consumption.usage_date = download_day.usage_date
        and consumption.entitlement_source = 'free_daily'
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
        'free_daily',
        1,
        download_day.usage_date
      from download_day
      cross join current_usage
      where current_usage.used < ${FREE_DAILY_DOWNLOAD_LIMIT}
      returning units
    )
    select
      exists(select 1 from inserted) as allowed,
      greatest(
        ${FREE_DAILY_DOWNLOAD_LIMIT} - current_usage.used
          - coalesce((select sum(units) from inserted), 0),
        0
      )::int as remaining,
      ((download_day.usage_date + 1)::timestamp at time zone 'Europe/Zurich') as "resetsAt"
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