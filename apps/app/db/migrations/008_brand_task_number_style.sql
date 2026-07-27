alter table brand_profiles
  add column if not exists instruction_number_color text not null
    default 'inverse',
  add column if not exists instruction_number_font_weight integer not null
    default 700;

update brand_profiles
set instruction_number_color = case instruction_badge_style
  when 'primary-text' then 'primary'
  when 'accent-text' then 'accent'
  else 'inverse'
end
where instruction_number_color = 'inverse';

alter table brand_profiles
  drop constraint if exists brand_profiles_instruction_number_color_check,
  drop constraint if exists brand_profiles_instruction_number_weight_check;

alter table brand_profiles
  add constraint brand_profiles_instruction_number_color_check
    check (
      instruction_number_color in (
        'inverse',
        'defaultText',
        'primary',
        'accent',
        'custom1',
        'custom2'
      )
    ),
  add constraint brand_profiles_instruction_number_weight_check
    check (instruction_number_font_weight in (400, 500, 600, 700, 800));
