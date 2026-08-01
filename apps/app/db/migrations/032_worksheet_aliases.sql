create table if not exists worksheet_aliases (
  alias_id uuid primary key,
  worksheet_id uuid not null references worksheets(id) on delete cascade,
  created_at timestamptz not null default now()
);

insert into worksheet_aliases (alias_id, worksheet_id) values
  ('fbde1b90-1857-4c9a-82db-122571a427d6', '15611dc0-3d61-458f-836a-2e594e238ded'),
  ('f0267633-bc5e-4b87-9f3a-913c8e94c68f', 'd92f1728-6945-487b-b829-4147728ff7bb'),
  ('083f6cf6-1f02-426c-b807-6bdddf1ce831', '3720dfb6-9cd6-47e9-b5b7-72bed8b50d45'),
  ('b0ac9d87-3b56-4a9a-9962-862978c7ffb8', '7aa7e152-9183-4029-949f-db01080af599'),
  ('b4c8aea5-31f9-494e-a841-8da33e51304a', '49941b97-4dfb-4931-bedf-8651c9ee0fcb'),
  ('c3d0c3b7-442c-43d4-8419-100b5fd1fe3e', '63840c43-ba80-4dbb-9327-a47bf9407298')
on conflict (alias_id) do update set worksheet_id = excluded.worksheet_id;
