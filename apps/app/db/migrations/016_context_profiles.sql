create table if not exists context_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text,
  name text not null,
  description text not null default '',
  is_system_template boolean not null default false,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists context_profiles_owner_name_idx
  on context_profiles (owner_user_id, name);

insert into context_profiles (
  owner_user_id,
  name,
  description,
  is_system_template,
  context
)
select
  null,
  template.name,
  template.description,
  true,
  template.context::jsonb
from (
  values
    (
      'Primary mathematics',
      'General mathematics context for primary education.',
      '{"subject":"mathematics","learnerStage":"primary"}'
    ),
    (
      'Lower-secondary science',
      'General science context for lower-secondary learners.',
      '{"subject":"general-science","learnerStage":"lower-secondary"}'
    ),
    (
      'Adult additional languages',
      'Language-learning context for adult education.',
      '{"subject":"additional-languages","learnerStage":"adult-education"}'
    )
) as template(name, description, context)
where not exists (
  select 1
  from context_profiles existing
  where existing.is_system_template = true
    and existing.name = template.name
);
