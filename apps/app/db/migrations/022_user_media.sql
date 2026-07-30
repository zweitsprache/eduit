create table if not exists user_media (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null,
  blob_path text not null unique,
  filename text not null,
  display_name text not null,
  alt_text text not null default '',
  content_type text not null,
  byte_size integer not null,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_media_filename_check check (
    char_length(trim(filename)) between 1 and 255
  ),
  constraint user_media_display_name_check check (
    char_length(trim(display_name)) between 1 and 160
  ),
  constraint user_media_byte_size_check check (
    byte_size > 0
  )
);

create index if not exists user_media_owner_created_idx
  on user_media (owner_user_id, created_at desc);

create index if not exists user_media_owner_name_idx
  on user_media (owner_user_id, lower(display_name));
