alter table worksheets
  add column if not exists preview_blob_path text,
  add column if not exists preview_updated_at timestamptz;
