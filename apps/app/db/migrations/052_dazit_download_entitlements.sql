create schema if not exists app;

create table if not exists app.download_consumption (
  id bigint generated always as identity primary key,
  user_id text not null,
  worksheet_id uuid not null references worksheets(id) on delete cascade,
  asset_kind text not null,
  entitlement_source text not null default 'free_daily',
  units integer not null default 1,
  usage_date date not null,
  created_at timestamptz not null default now(),
  constraint download_consumption_asset_kind_check
    check (asset_kind in ('worksheet', 'answer_key')),
  constraint download_consumption_entitlement_source_check
    check (entitlement_source in ('free_daily', 'subscription', 'purchased_credit')),
  constraint download_consumption_units_check check (units > 0)
);

create index if not exists download_consumption_user_day_idx
  on app.download_consumption (user_id, usage_date, entitlement_source);

create index if not exists download_consumption_worksheet_idx
  on app.download_consumption (worksheet_id, created_at desc);