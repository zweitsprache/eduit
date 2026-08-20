alter table dazit_publications
  add column if not exists grammar_tags jsonb not null default '[]'::jsonb;
