alter table brand_profiles
  drop constraint if exists brand_profiles_style_preset_check;

alter table brand_profiles
  add constraint brand_profiles_style_preset_check
    check (
      style_preset in (
        'educational',
        'semi-academic',
        'academic'
      )
    );
