alter table brand_profiles
  add column if not exists instruction_badge_style text not null
  default 'filled';

alter table brand_profiles
  drop constraint if exists brand_profiles_instruction_badge_style_check;

alter table brand_profiles
  add constraint brand_profiles_instruction_badge_style_check
  check (
    instruction_badge_style in (
      'filled',
      'primary-text',
      'accent-text'
    )
  );
