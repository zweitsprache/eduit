export const RICH_TEXT_TYPE_GROUPS = [
  {
    category: 'Alltag und persönliche Kommunikation',
    types: [
      'E-Mail (privat und geschäftlich)',
      'SMS/Chatnachricht',
      'Postkarte',
      'Einladung',
      'Notiz/Mitteilung (Zettel, Memo)',
      'Privatbrief',
      'Glückwunschkarte',
    ],
  },
  {
    category: 'Amt, Behörde, Formulare',
    types: [
      'Formular (mit Ausfüllhinweisen)',
      'Antrag',
      'Merkblatt',
      'Bescheid/behördliches Schreiben',
      'Vertrag (einfach, z.B. Mietvertrag)',
      'Aushang/Hinweisschild',
    ],
  },
  {
    category: 'Beruf und Bewerbung',
    types: [
      'Lebenslauf',
      'Bewerbungsschreiben',
      'Stellenanzeige',
      'Arbeitszeugnis',
      'Beschwerde/Reklamation',
      'Anfrage',
      'Kündigung',
    ],
  },
  {
    category: 'Information und Nachrichten',
    types: [
      'Nachricht/Meldung (Zeitung)',
      'Bericht',
      'Reportage',
      'Sachtext',
      'Wetterbericht',
      'Lexikon-/Wiki-Artikel',
      'Statistik-/Infografik-Text',
    ],
  },
  {
    category: 'Anleitung und Orientierung',
    types: [
      'Gebrauchsanweisung/Bedienungsanleitung',
      'Kochrezept',
      'Beipackzettel',
      'Wegbeschreibung',
      'Fahrplan',
      'Speisekarte',
      'Checkliste',
      'Verhaltensregeln/Verbotsschild',
    ],
  },
  {
    category: 'Meinung und Argumentation',
    types: [
      'Leserbrief',
      'Kommentar',
      'Rezension/Kritik (z.B. Produkt, Film)',
      'Stellungnahme',
    ],
  },
  {
    category: 'Werbung und öffentliche Texte',
    types: [
      'Werbeanzeige/Flyer',
      'Blogeintrag',
      'Online-Rezension/Bewertung',
    ],
  },
] as const;

export const RICH_TEXT_TYPES = RICH_TEXT_TYPE_GROUPS.flatMap(
  ({ types }) => [...types],
);
