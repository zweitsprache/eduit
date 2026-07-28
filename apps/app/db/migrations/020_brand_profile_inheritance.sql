alter table brand_profiles
  add column if not exists parent_profile_id uuid
    references brand_profiles(id) on delete set null;

alter table brand_profiles
  add column if not exists settings_overrides jsonb;

create index if not exists brand_profiles_parent_profile_id_idx
  on brand_profiles(parent_profile_id);
