create table if not exists worksheets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text,
  brand_profile_id uuid references brand_profiles(id) on delete set null,
  title text not null default 'Untitled Worksheet',
  content_html text not null default '',
  document_size text not null default 'a4-portrait',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worksheets_document_size_check check (
    document_size in (
      'a4-portrait',
      'a4-landscape',
      'letter-portrait',
      'letter-landscape'
    )
  ),
  constraint worksheets_status_check check (status in ('draft', 'published'))
);

create index if not exists worksheets_owner_updated_idx
  on worksheets (owner_user_id, updated_at desc);

create index if not exists worksheets_brand_profile_idx
  on worksheets (brand_profile_id);
