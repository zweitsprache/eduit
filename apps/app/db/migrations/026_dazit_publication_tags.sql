alter table dazit_publications
  add column if not exists tags jsonb not null default '[]'::jsonb;
