alter table brand_profiles
  add column if not exists footer_1_html text not null default '',
  add column if not exists footer_2_html text not null default '';

update brand_profiles
set footer_1_html = name
where footer_1_html = '';

update brand_profiles
set footer_2_html = 'Creator name'
where footer_2_html = '';
