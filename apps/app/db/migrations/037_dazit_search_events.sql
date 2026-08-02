create table if not exists dazit_search_events (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  result_count integer not null default 0,
  filters jsonb not null default '{}'::jsonb,
  anonymous_session_id text,
  created_at timestamptz not null default now()
);

create index if not exists dazit_search_events_created_at_idx on dazit_search_events (created_at desc);
create index if not exists dazit_search_events_query_idx on dazit_search_events (query);
