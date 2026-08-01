alter table worksheets
  add column if not exists source_revision bigint not null default 1;

alter table dazit_publications
  add column if not exists published_revision bigint;

update dazit_publications p
set published_revision = w.source_revision
from worksheets w
where w.id = p.worksheet_id
  and p.published_revision is null;
