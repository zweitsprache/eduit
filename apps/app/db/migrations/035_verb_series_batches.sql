create table if not exists verb_series_batches (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references neon_auth."user"(id) on delete cascade,
  publish boolean not null default false,
  total_jobs integer not null check (total_jobs > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists verb_series_jobs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references verb_series_batches(id) on delete cascade,
  infinitive text not null,
  config_id text not null,
  tense text not null,
  mood text not null,
  label text not null,
  level text not null,
  brand_profile_id uuid not null references brand_profiles(id),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  worksheet_id uuid references worksheets(id) on delete set null,
  worksheet_title text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, infinitive, config_id)
);

create index if not exists verb_series_jobs_batch_id_idx
  on verb_series_jobs(batch_id, status);
