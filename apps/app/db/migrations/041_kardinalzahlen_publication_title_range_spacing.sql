-- Normalize spacing around number ranges in Kardinalzahlen publication titles.
-- Example: "Kardinalzahlen ... 1–10" -> "Kardinalzahlen ... 1 – 10"
update dazit_publications
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
