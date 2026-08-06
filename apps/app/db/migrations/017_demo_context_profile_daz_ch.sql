insert into context_profiles (
  owner_user_id,
  name,
  description,
  is_system_template,
  context
)
select
  null,
  'DaZ Schweiz – Erwachsenenbildung',
  'Deutsch als Zweitsprache für erwachsene Lernende in der Schweiz.',
  true,
  jsonb_build_object(
    'subject', 'daz',
    'customSubject', '',
    'learnerStage', 'adult-education',
    'ageMin', 18,
    'ageMax', 65,
    'contentLanguage', 'German (de-CH)',
    'country', 'Schweiz (staatliche Integrationsförderung, Kantonale Integrationsprogramme KIP)',
    'localLevel', 'Kantonaler Integrationskurs / fide-anerkannter Sprachkurs (kein Schulstufensystem, sondern Erwachsenen-Sprachförderung)',
    'curriculum', 'fide – Rahmencurriculum für die sprachliche Förderung von Migrantinnen und Migranten (handlungs- und szenarienorientiert)',
    'languageLevel', 'CEFR A2 (Ziel: A2 mündlich/schriftlich, teilweise Vorbereitung auf fide-Test bzw. Sprachnachweis A2)',
    'learnerContext', 'Erwachsene mit Migrationshintergrund und heterogenen Erstsprachen; unterschiedliche Alphabetisierungs- und Schulbildungsniveaus im Herkunftsland. Teilnehmende leben neu in der Schweiz und benötigen praxisnahe, dialektsensible Inhalte: Hochdeutsch als Zielsprache und Unterstützung beim Verstehen von Schweizerdeutsch im Alltag. Ein Teil der Lernenden ist berufstätig und daher zeitlich eingeschränkt.'
  )
where not exists (
  select 1
  from context_profiles
  where is_system_template = true
    and name = 'DaZ Schweiz – Erwachsenenbildung'
);
