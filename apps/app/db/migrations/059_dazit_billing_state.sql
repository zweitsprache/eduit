create schema if not exists app;

create table if not exists app.dazit_billing_state (
  user_id text primary key,
  polar_customer_id text unique,
  tier text not null default 'free',
  subscription_status text,
  current_period_end timestamptz,
  raw_state jsonb,
  updated_at timestamptz not null default now(),
  constraint dazit_billing_state_tier_check check (tier in ('free', 'plus', 'unlimited'))
);
