create schema if not exists app;

create table if not exists app.user_registration_profile (
  user_id text primary key,
  first_name text,
  last_name text,
  terms_version text not null,
  terms_accepted_at timestamptz not null,
  newsletter_opt_in boolean not null default false,
  newsletter_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);