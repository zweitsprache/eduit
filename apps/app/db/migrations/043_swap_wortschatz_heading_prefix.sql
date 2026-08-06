-- Swap vocabulary prefixes to suffixes in worksheet titles and first H1 heading text.

update worksheets
set title = trim(substring(title from '^Basiswortschatz\s*\|\s*(.*)$')) || ' | Basiswortschatz'
where title ~ '^Basiswortschatz\s*\|\s*.+$';

update worksheets
set title = trim(substring(title from '^Aufbauwortschatz\s*\|\s*(.*)$')) || ' Aufbauwortschatz'
where title ~ '^Aufbauwortschatz\s*\|\s*.+$';

-- Update first matching serialized heading text attribute.
update worksheets
set content_html = regexp_replace(
  content_html,
  '(data-heading-text=")Basiswortschatz\s*\|\s*([^"]*)(")',
  '\1\2 | Basiswortschatz\3'
)
where content_html ~ 'data-heading-text="Basiswortschatz\s*\|\s*[^"]+"';

update worksheets
set content_html = regexp_replace(
  content_html,
  '(data-heading-text=")Aufbauwortschatz\s*\|\s*([^"]*)(")',
  '\1\2 Aufbauwortschatz\3'
)
where content_html ~ 'data-heading-text="Aufbauwortschatz\s*\|\s*[^"]+"';

-- Update first matching rendered H1 text as a fallback.
update worksheets
set content_html = regexp_replace(
  content_html,
  '(<h1[^>]*>)Basiswortschatz\s*\|\s*([^<]*)(</h1>)',
  '\1\2 | Basiswortschatz\3'
)
where content_html ~ '<h1[^>]*>Basiswortschatz\s*\|\s*[^<]+';

update worksheets
set content_html = regexp_replace(
  content_html,
  '(<h1[^>]*>)Aufbauwortschatz\s*\|\s*([^<]*)(</h1>)',
  '\1\2 Aufbauwortschatz\3'
)
where content_html ~ '<h1[^>]*>Aufbauwortschatz\s*\|\s*[^<]+';
