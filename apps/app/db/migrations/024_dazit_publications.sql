create table if not exists dazit_publications (
  worksheet_id uuid primary key references worksheets(id) on delete cascade,
  slug text not null unique,
  title text not null,
  document_type text not null check (
    document_type in (
      'Arbeitsblatt',
      'Merkblatt',
      'Verbtabelle',
      'Deklinationstabelle'
    )
  ),
  pdf_path text not null,
  thumbnail_paths jsonb not null default '[]'::jsonb,
  page_count integer not null check (page_count > 0),
  size_bytes bigint not null check (size_bytes >= 0),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dazit_publications_published_at_idx
  on dazit_publications (published_at desc);
