alter table worksheets
  drop constraint if exists worksheets_document_size_check;

alter table worksheets
  add constraint worksheets_document_size_check check (
    document_size in (
      'a4-portrait',
      'a4-landscape',
      'a5-landscape',
      'letter-portrait',
      'letter-landscape'
    )
  );
