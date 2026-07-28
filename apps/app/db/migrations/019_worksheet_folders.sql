create table if not exists worksheet_folders (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null,
  parent_id uuid references worksheet_folders(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worksheet_folders_name_check check (
    char_length(trim(name)) between 1 and 120
  )
);

create index if not exists worksheet_folders_owner_parent_name_idx
  on worksheet_folders (owner_user_id, parent_id, lower(name));

alter table worksheets
  add column if not exists folder_id uuid
  references worksheet_folders(id) on delete set null;

create index if not exists worksheets_folder_idx
  on worksheets (folder_id);
