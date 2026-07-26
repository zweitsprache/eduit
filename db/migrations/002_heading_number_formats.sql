alter table brand_profiles
  add column if not exists heading_number_formats jsonb;

update brand_profiles
set heading_number_formats = jsonb_build_object(
  '1', heading_number_format,
  '2', heading_number_format,
  '3', heading_number_format,
  '4', heading_number_format,
  '5', heading_number_format
)
where heading_number_formats is null;

alter table brand_profiles
  alter column heading_number_formats set not null;

alter table brand_profiles
  alter column heading_number_formats set default
    '{"1":"decimal","2":"decimal","3":"decimal","4":"decimal","5":"decimal"}'::jsonb;

alter table brand_profiles
  drop column if exists heading_number_format;
