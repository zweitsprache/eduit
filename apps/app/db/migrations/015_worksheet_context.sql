alter table worksheets
  add column if not exists context jsonb
  not null default '{}'::jsonb;
