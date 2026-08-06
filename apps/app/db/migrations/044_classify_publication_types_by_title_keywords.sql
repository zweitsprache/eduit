-- Classify publication type from title keywords for legacy/mis-typed rows.
-- Rule 1: titles containing "Dialog" or "Dialoge" -> document_type = 'Dialog'
-- Rule 2: titles containing "Leseverstehen" -> document_type = 'Leseverstehen' (applied after Rule 1)

update dazit_publications
set document_type = 'Dialog',
    updated_at = now()
where document_type <> 'Dialog'
  and title ~* '(^|[^[:alpha:]])dialog(e)?([^[:alpha:]]|$)';

update dazit_publications
set document_type = 'Leseverstehen',
    updated_at = now()
where document_type <> 'Leseverstehen'
  and title ~* '(^|[^[:alpha:]])leseverstehen([^[:alpha:]]|$)';
