alter table worksheets
  add column if not exists show_solutions boolean
  not null default false;
