alter table dazit_publications
  add column if not exists search_snippet text;
