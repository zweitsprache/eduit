create extension if not exists pgcrypto;

create table if not exists brand_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  primary_color text not null,
  accent_color text not null,
  font_family text not null,
  logo_url text,
  instruction_number_format text not null,
  heading_number_formats jsonb not null default
    '{"1":"decimal","2":"decimal","3":"decimal","4":"decimal","5":"decimal"}'::jsonb,
  date_format text not null,
  is_default boolean not null default false,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_profiles_primary_color_check
    check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint brand_profiles_accent_color_check
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint brand_profiles_instruction_format_check
    check (instruction_number_format in (
      'upper-alpha', 'lower-alpha', 'decimal', 'decimal-leading-zero'
    )),
  constraint brand_profiles_date_format_check
    check (date_format in ('dd.MM.yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd'))
);

create unique index if not exists brand_profiles_single_default_idx
  on brand_profiles (is_default)
  where is_default = true;

insert into brand_profiles (
  slug, name, description, primary_color, accent_color, font_family, logo_url,
  instruction_number_format, heading_number_formats, date_format,
  is_default, is_system, is_active
) values
  (
    'eduit',
    'Eduit',
    'The default Eduit document identity.',
    '#11224d',
    '#cc6600',
    '"Encode Sans Semi Condensed", sans-serif',
    '/logo/eduit_logo.svg',
    'upper-alpha',
    '{"1":"decimal","2":"decimal","3":"decimal","4":"decimal","5":"decimal"}'::jsonb,
    'dd.MM.yyyy',
    true,
    true,
    true
  ),
  (
    'academic-classic',
    'Academic Classic',
    'A traditional profile for formal learning material.',
    '#23344d',
    '#8b5e34',
    'Georgia, "Times New Roman", serif',
    null,
    '{"1":"decimal","2":"decimal","3":"decimal","4":"decimal","5":"decimal"}'::jsonb,
    '{"1":"decimal","2":"decimal","3":"decimal","4":"decimal","5":"decimal"}'::jsonb,
    'dd.MM.yyyy',
    false,
    true,
    true
  ),
  (
    'modern-neutral',
    'Modern Neutral',
    'A restrained, accessible profile for general documents.',
    '#243238',
    '#397c78',
    'Arial, Helvetica, sans-serif',
    null,
    'upper-alpha',
    'decimal',
    'yyyy-MM-dd',
    false,
    true,
    true
  )
on conflict (slug) do nothing;
