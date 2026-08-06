-- Normalize publication type for XYZ marker titles.
-- Rule: if title contains «XYZ», classify as Verbtabelle.

update dazit_publications
set document_type = 'Verbtabelle',
    updated_at = now()
where document_type <> 'Verbtabelle'
  and title like '%«XYZ»%';
