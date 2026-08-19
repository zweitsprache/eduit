alter table dazit_publications
  drop constraint if exists dazit_publications_document_type_check;

alter table dazit_publications
  add constraint dazit_publications_document_type_check check (
    document_type in (
      'Arbeitsblatt',
      'Merkblatt',
      'Verbtabelle',
      'Deklinationstabelle',
      'Kommunikationskarten',
      'Lernkarten',
      'Wechselspiel',
      'Domino',
      'Dialog',
      'Wörterliste',
      'Leseverstehen'
    )
  );
