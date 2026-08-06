-- Corrective migration: classify titles containing guillemets «...». 
-- XYZ is a placeholder for any verb infinitive inside guillemets.

update dazit_publications
set document_type = 'Verbtabelle',
    updated_at = now()
where document_type <> 'Verbtabelle'
  and title ~ '«[^»]+»';
