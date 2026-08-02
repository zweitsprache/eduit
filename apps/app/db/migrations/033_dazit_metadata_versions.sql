alter table dazit_publications
  add column if not exists metadata_version integer not null default 1;
