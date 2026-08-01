alter table dazit_publications
  add column if not exists action_field text check (
    action_field is null or action_field in (
      'Deutschkurs',
      'Gesundheit',
      'Sicherheit und Notfälle',
      'Familie und Partnerschaft',
      'Kinder und Schule',
      'Soziales Netz',
      'Beratung und Unterstützung',
      'Einkaufen',
      'Ernährung',
      'Wohnen',
      'Mobilität',
      'Finanzen und Versicherungen',
      'Behörden',
      'Freizeit und Hobbys',
      'Kultur und Identität',
      'Arbeit',
      'Arbeitssuche',
      'Umwelt und Klima',
      'Technologie',
      'Weiterbildung'
    )
  );
