create table if not exists worksheet_relationships (
  id uuid primary key default gen_random_uuid(),
  source_worksheet_id uuid not null references worksheets(id) on delete cascade,
  related_worksheet_id uuid not null references worksheets(id) on delete cascade,
  relationship_type text not null check (
    relationship_type in (
      'word_grid_from_verb_table',
      'conjugation_exercise_from_verb_table'
    )
  ),
  source_revision integer not null,
  created_at timestamptz not null default now(),
  unique (source_worksheet_id, related_worksheet_id),
  check (source_worksheet_id <> related_worksheet_id)
);

create index if not exists worksheet_relationships_source_idx
  on worksheet_relationships (source_worksheet_id);

create index if not exists worksheet_relationships_related_idx
  on worksheet_relationships (related_worksheet_id);
