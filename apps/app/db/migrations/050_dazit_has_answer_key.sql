alter table dazit_publications
  add column if not exists has_answer_key boolean not null default false;

update dazit_publications p
set has_answer_key = coalesce(
  (
    select w.show_solutions
    from worksheets w
    where w.id = p.worksheet_id
  ),
  false
);
