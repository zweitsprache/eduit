alter table brand_profiles
  add column if not exists custom_color_1 text not null default '#101828',
  add column if not exists custom_color_2 text not null default '#667085',
  add column if not exists heading_styles jsonb not null default
    '{
      "1":{"numberColor":"custom1","numberFontWeight":700,"textColor":"custom1","textFontWeight":700},
      "2":{"numberColor":"custom1","numberFontWeight":700,"textColor":"custom1","textFontWeight":700},
      "3":{"numberColor":"custom1","numberFontWeight":700,"textColor":"custom1","textFontWeight":700},
      "4":{"numberColor":"custom1","numberFontWeight":700,"textColor":"custom1","textFontWeight":700},
      "5":{"numberColor":"custom1","numberFontWeight":700,"textColor":"custom1","textFontWeight":700}
    }'::jsonb;

alter table brand_profiles
  drop constraint if exists brand_profiles_custom_color_1_check,
  drop constraint if exists brand_profiles_custom_color_2_check;

alter table brand_profiles
  add constraint brand_profiles_custom_color_1_check
    check (custom_color_1 ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint brand_profiles_custom_color_2_check
    check (custom_color_2 ~ '^#[0-9A-Fa-f]{6}$');
