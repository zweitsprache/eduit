create table if not exists learning_card_publications (
  worksheet_id uuid primary key references worksheets(id) on delete cascade,
  token text not null unique,
  title text not null,
  snapshot jsonb not null,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learning_card_publications_token_idx
  on learning_card_publications (token);

create index if not exists learning_card_publications_published_idx
  on learning_card_publications (is_published, updated_at desc);