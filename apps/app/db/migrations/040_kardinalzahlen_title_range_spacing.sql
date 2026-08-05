-- Normalize spacing around number ranges in Kardinalzahlen worksheet titles.
-- Example: "Kardinalzahlen ... 1–10" -> "Kardinalzahlen ... 1 – 10"
update worksheets
set title = regexp_replace(
  title,
  '([0-9])\s*[–-]\s*([0-9])',
  '\1 – \2',
  'g'
)
where title ilike '%Kardinalzahlen%'
  and title ~ '[0-9]\s*[–-]\s*[0-9]'
  and title <> regexp_replace(
    title,
    '([0-9])\s*[–-]\s*([0-9])',
    '\1 – \2',
    'g'
  );
