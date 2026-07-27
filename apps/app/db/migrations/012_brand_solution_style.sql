alter table brand_profiles
  add column if not exists solution_font_family text not null
    default '"Linotype Feltpen", cursive',
  add column if not exists solution_font_size numeric(5, 2) not null
    default 24.5,
  add column if not exists solution_color text not null
    default '#079455';

alter table brand_profiles
  drop constraint if exists brand_profiles_solution_font_size_check,
  drop constraint if exists brand_profiles_solution_color_check;

alter table brand_profiles
  add constraint brand_profiles_solution_font_size_check
    check (solution_font_size >= 8 and solution_font_size <= 72),
  add constraint brand_profiles_solution_color_check
    check (solution_color ~ '^#[0-9A-Fa-f]{6}$');

update brand_profiles
set solution_font_family = '"Linotype Feltpen", cursive',
    solution_font_size = 24.5,
    solution_color = '#079455'
where slug = 'eduit';
