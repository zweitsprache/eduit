-- Normalize spacing around number ranges in worksheet H1 headings.
-- Targets serialized custom-heading nodes at level 1 inside worksheets.content_html.
update worksheets
set content_html = regexp_replace(
  content_html,
  '(data-heading-text="[^"]*[0-9])\s*[–-]\s*([0-9][^"]*"[^>]*data-heading-level="1")',
  '\1 – \2',
  'g'
)
where content_html ~ 'data-type="custom-heading"'
  and content_html ~ 'data-heading-level="1"'
  and content_html ~ 'data-heading-text="[^"]*[0-9]\s*[–-]\s*[0-9][^"]*"';
