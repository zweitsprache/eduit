alter table brand_profiles
  add column if not exists fixed_heading_number_width boolean
  not null default false;
