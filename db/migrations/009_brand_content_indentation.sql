alter table brand_profiles
  add column if not exists content_indentation boolean
  not null default false;
