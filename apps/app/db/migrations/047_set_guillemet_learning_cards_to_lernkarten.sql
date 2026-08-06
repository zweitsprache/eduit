-- Reclassify guillemet-title publications that actually contain learning-card blocks.
-- Rule: title has «...», worksheet content contains data-type="learning-cards".

update dazit_publications as publication
set document_type = 'Lernkarten',
    updated_at = now()
from worksheets as worksheet
where publication.worksheet_id = worksheet.id
  and publication.document_type <> 'Lernkarten'
  and publication.title ~ '«[^»]+»'
  and (
    worksheet.content_html like '%data-type="learning-cards"%'
    or worksheet.content_html like '%data-type=''learning-cards''%'
  );
