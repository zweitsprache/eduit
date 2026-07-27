export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const content = {
  de: {
    localeName: 'Deutsch',
    otherLocale: 'EN',
    nav: { features: 'Funktionen', pricing: 'Preise', story: 'Warum Eduit?', login: 'Anmelden', cta: 'Kostenlos starten' },
    hero: {
      eyebrow: 'Arbeitsblätter, die Unterricht verstehen',
      title: 'Von der Idee zum druckfertigen Arbeitsblatt.',
      description: 'Eduit verbindet durchdachtes Aufgabendesign mit einem Editor, der Lehrpersonen nicht im Weg steht. Erstellen, gestalten und exportieren – in Minuten statt Stunden.',
      primary: 'Arbeitsblatt erstellen',
      secondary: 'Funktionen ansehen',
      note: 'Für Schulen, Verlage und Bildungsprojekte.',
    },
    preview: {
      label: 'Live-Arbeitsblatt',
      title: 'Sprache im Alltag',
      task: '1. Ordne die Begriffe den passenden Bildern zu.',
      words: ['der Fahrplan', 'die Haltestelle', 'umsteigen'],
      status: 'Alle Änderungen gespeichert',
    },
    proof: [
      ['Klar strukturiert', 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.'],
      ['Markenkonform', 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.'],
      ['Direkt als PDF', 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.'],
    ],
    problem: {
      kicker: 'Weniger Formatieren. Mehr Unterrichten.',
      title: 'Für Bildungsinhalte gemacht.',
      description: 'Textverarbeitung bedeutet oft mühsames Formatieren. Layoutsoftware setzt voraus, dass du selbst zur Designerin oder zum Designer wirst. Eduit ist die bessere, speziell für Bildungsinhalte entwickelte Alternative: Wiederverwendbare Aufgabenbausteine, konsistente Gestaltungsregeln, automatische Nummerierung und druckfertige Ausgabe arbeiten in einem fokussierten Ablauf zusammen. So verbringst du weniger Zeit mit Kästchen, Abständen und Seitenumbrüchen – und mehr Zeit mit gutem Unterricht.',
    },
    stories: [
      {
        kicker: 'Bildungsspezifisch bis ins Detail',
        title: 'Didaktische Struktur ist bereits eingebaut.',
        description: 'Eduit versteht den Unterschied zwischen einer Aufgabe, einer Lösung und einem Beispiel. Aufgabentypen bringen die passenden Felder, Regeln und Darstellungen bereits mit – von Lückentexten und Zuordnungen bis zu Dialogen und Wortgittern. Nummerierung, Lösungsansichten und wiederkehrende Anweisungen entstehen automatisch, damit Inhalte fachlich klar bleiben und sich über ganze Lehrmittel hinweg konsistent verhalten.',
      },
      {
        kicker: 'Eine Quelle. Jedes Format.',
        title: 'Einmal erstellen. Für Print und Web publizieren.',
        description: 'Mit Eduit entsteht Inhalt nicht länger getrennt für Papier und Bildschirm. Dieselben strukturierten Bausteine lassen sich als hochwertiges Arbeitsblatt ausgeben und für interaktive digitale Lernangebote weiterverwenden. Das reduziert doppelte Arbeit, verhindert Abweichungen zwischen Versionen und macht hybride Publikation zu einem verlässlichen Prozess statt zu einem zusätzlichen Projekt.',
      },
    ],
    features: [
      ['Bausteine für Unterricht', 'Lückentexte, Zuordnungen, Dialoge, Wortgitter und viele weitere Aufgabentypen.'],
      ['Gestaltung mit System', 'Markenprofile halten Schriften, Farben, Nummerierung und Abstände konsistent.'],
      ['Saubere Ausgabe', 'Mehrseitige Arbeitsblätter als druckfertige PDFs – inklusive Lösungen.'],
      ['Gemeinsam skalieren', 'Vorlagen und Standards helfen Teams, schneller und einheitlicher zu arbeiten.'],
    ],
    pricing: {
      kicker: 'Einfach starten',
      title: 'Der passende Rahmen für jede Idee.',
      plans: [
        ['Free', 'Für erste Arbeitsblätter', 'CHF 0', ['Editor ausprobieren', 'Basis-Aufgabentypen', 'PDF-Export'], 'Kostenlos starten'],
        ['Pro', 'Für Lehrpersonen und Projekte', 'CHF 19', ['Alle Aufgabentypen', 'Lösungen und Markenprofile', 'Priorisierte Exporte'], 'Pro starten'],
        ['Scale', 'Für Teams und Organisationen', 'Auf Anfrage', ['Gemeinsame Standards', 'Mehrere Markenprofile', 'Begleitete Einführung'], 'Kontakt aufnehmen'],
      ],
    },
    final: { title: 'Bereit für dein erstes Dokument?', description: 'Konzentriere dich auf den Inhalt. Eduit kümmert sich um die Form.', cta: 'Jetzt loslegen' },
    footer: { product: 'Produkt', company: 'Unternehmen', legal: 'Rechtliches', privacy: 'Datenschutz', imprint: 'Impressum', rights: 'Alle Rechte vorbehalten.' },
  },
  en: {
    localeName: 'English',
    otherLocale: 'DE',
    nav: { features: 'Features', pricing: 'Pricing', story: 'Why Eduit?', login: 'Sign in', cta: 'Start for free' },
    hero: {
      eyebrow: 'Worksheets that understand teaching',
      title: 'From idea to print-ready worksheet.',
      description: 'Eduit combines thoughtful activity design with an editor that stays out of a teacher’s way. Create, style, and export in minutes—not hours.',
      primary: 'Create a worksheet',
      secondary: 'Explore features',
      note: 'For schools, publishers, and education projects.',
    },
    preview: {
      label: 'Live worksheet',
      title: 'Language in everyday life',
      task: '1. Match the terms to the correct pictures.',
      words: ['the timetable', 'the bus stop', 'change trains'],
      status: 'All changes saved',
    },
    proof: [
      ['Clearly structured', 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.'],
      ['Always on brand', 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.'],
      ['Ready for PDF', 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.'],
    ],
    problem: {
      kicker: 'Less formatting. More teaching.',
      title: 'Built for educational content.',
      description: 'Word processors make you wrestle with formatting. Layout software expects you to become a designer. Eduit is the better, purpose-built alternative: reusable activity blocks, consistent design rules, automatic numbering, and print-ready output work together in one focused workflow. Spend less time adjusting boxes, spacing, and page breaks—and more time creating meaningful learning experiences.',
    },
    stories: [
      {
        kicker: 'Education-specific by design',
        title: 'Teaching structure is already built in.',
        description: 'Eduit understands the difference between an activity, a solution, and an example. Every activity type comes with the right fields, rules, and presentation—from gap fills and matching tasks to dialogues and word grids. Numbering, answer views, and recurring instructions are created automatically, keeping content pedagogically clear and consistent across an entire learning program.',
      },
      {
        kicker: 'One source. Every format.',
        title: 'Create once. Publish for print and web.',
        description: 'With Eduit, content no longer has to be rebuilt separately for paper and screen. The same structured blocks can produce polished worksheets and power interactive digital learning experiences. That removes duplicate work, prevents versions from drifting apart, and turns hybrid publishing into a dependable workflow instead of another production project.',
      },
    ],
    features: [
      ['Built for learning', 'Gap fills, matching, dialogues, word grids, and many more activity types.'],
      ['Design with a system', 'Brand profiles keep fonts, colors, numbering, and spacing consistent.'],
      ['Clean output', 'Multi-page, print-ready PDFs—including answer keys.'],
      ['Scale together', 'Templates and standards help teams work faster and stay consistent.'],
    ],
    pricing: {
      kicker: 'Start simply',
      title: 'A plan for every teaching idea.',
      plans: [
        ['Free', 'For your first worksheets', 'CHF 0', ['Try the editor', 'Core activity types', 'PDF export'], 'Start for free'],
        ['Pro', 'For educators and projects', 'CHF 19', ['Every activity type', 'Solutions and brand profiles', 'Priority exports'], 'Start Pro'],
        ['Scale', 'For teams and organizations', 'Let’s talk', ['Shared standards', 'Multiple brand profiles', 'Guided onboarding'], 'Contact us'],
      ],
    },
    final: { title: 'Ready for your first document?', description: 'Focus on the learning. Eduit will take care of the format.', cta: 'Get started' },
    footer: { product: 'Product', company: 'Company', legal: 'Legal', privacy: 'Privacy', imprint: 'Imprint', rights: 'All rights reserved.' },
  },
} as const;
