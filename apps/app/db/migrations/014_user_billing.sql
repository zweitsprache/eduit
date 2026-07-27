create schema if not exists app;

create table if not exists app.billing_state (
  user_id text primary key,
  polar_customer_id text unique,
  tier text not null default 'free',
  subscription_status text,
  current_period_end timestamptz,
  raw_state jsonb,
  updated_at timestamptz not null default now(),
  constraint billing_state_tier_check check (tier in ('free', 'pro', 'scale'))
);

create table if not exists app.billing_meter (
  user_id text not null references app.billing_state(user_id) on delete cascade,
  meter_id text not null,
  meter_slug text,
  balance numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, meter_id)
);

create index if not exists billing_meter_user_slug_idx
  on app.billing_meter (user_id, meter_slug);
