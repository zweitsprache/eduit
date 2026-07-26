alter table brand_profiles
  add column if not exists style_preset text not null default 'educational';

alter table brand_profiles
  drop constraint if exists brand_profiles_style_preset_check;

alter table brand_profiles
  add constraint brand_profiles_style_preset_check
    check (style_preset in ('educational', 'academic'));

update brand_profiles
set style_preset = 'academic'
where slug = 'academic-classic';
