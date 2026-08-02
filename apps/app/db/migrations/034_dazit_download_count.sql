alter table dazit_publications
  add column if not exists download_count bigint not null default 0;

alter table dazit_publications
  drop constraint if exists dazit_publications_download_count_check;

alter table dazit_publications
  add constraint dazit_publications_download_count_check
  check (download_count >= 0);
