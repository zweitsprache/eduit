alter table dazit_publications
  add column if not exists level text check (
    level in ('A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2')
  ),
  add column if not exists action_competencies jsonb not null default '[]'::jsonb,
  add column if not exists language_competencies jsonb not null default '[]'::jsonb,
  add column if not exists action_competency_contribution_html text;
