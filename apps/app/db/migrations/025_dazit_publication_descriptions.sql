alter table dazit_publications
  add column if not exists description_html text,
  add column if not exists excerpt text;
