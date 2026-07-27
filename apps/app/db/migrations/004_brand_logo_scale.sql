alter table brand_profiles
  add column if not exists logo_scale numeric(4, 2) not null default 1;

alter table brand_profiles
  drop constraint if exists brand_profiles_logo_scale_check;

alter table brand_profiles
  add constraint brand_profiles_logo_scale_check
  check (logo_scale >= 0.5 and logo_scale <= 2);
