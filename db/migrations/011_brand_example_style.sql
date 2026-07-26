alter table brand_profiles
  add column if not exists example_font_family text not null
    default '"Linotype Feltpen", cursive',
  add column if not exists example_font_size numeric(5, 2) not null
    default 24.5,
  add column if not exists example_color text not null
    default '#009fe3';

alter table brand_profiles
  drop constraint if exists brand_profiles_example_font_size_check,
  drop constraint if exists brand_profiles_example_color_check;

alter table brand_profiles
  add constraint brand_profiles_example_font_size_check
    check (example_font_size >= 8 and example_font_size <= 72),
  add constraint brand_profiles_example_color_check
    check (example_color ~ '^#[0-9A-Fa-f]{6}$');

update brand_profiles
set example_font_family = '"Linotype Feltpen", cursive',
    example_font_size = 24.5,
    example_color = '#009fe3'
where slug = 'eduit';
