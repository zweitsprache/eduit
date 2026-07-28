"use client";

import { useEffect, type RefObject } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';

const EN_TO_DE: Record<string, string> = {
  'Cancel': 'Abbrechen',
  'Generate': 'Generieren',
  'Generating…': 'Wird generiert…',
  'Creating source text…': 'Quelltext wird erstellt…',
  'Reading source text…': 'Quelltext wird gelesen…',
  'Drafting questions…': 'Fragen werden entworfen…',
  'Reviewing question quality…': 'Fragenqualität wird geprüft…',
  'Inserting questions…': 'Fragen werden eingefügt…',
  'Close AI generator': 'KI-Generator schliessen',
  'Auto': 'Automatisch',
  'Topic': 'Thema',
  'Source': 'Quelle',
  'Source text': 'Quelltext',
  'From worksheet': 'Aus Arbeitsblatt',
  'Worksheet': 'Arbeitsblatt',
  'Paste': 'Einfügen',
  'Paste text': 'Text einfügen',
  'Original text': 'Originaltext',
  'Generation context': 'Kontext für die Generierung',
  'Activity settings': 'Aufgabeneinstellungen',
  'Question settings': 'Frageneinstellungen',
  'Text settings': 'Texteinstellungen',
  'Dialogue settings': 'Dialogeinstellungen',
  'Mini-form settings': 'Miniformular-Einstellungen',
  'Crossword settings': 'Kreuzworträtsel-Einstellungen',
  'Topic / scenario': 'Thema / Szenario',
  'Topic / draft title': 'Thema / Arbeitstitel',
  'Challenge focus': 'Schwerpunkt der Herausforderung',
  'Topic / learning focus': 'Thema / Lernfokus',
  'Generate source': 'Quelle generieren',
  'Cognitive level': 'Kognitives Niveau',
  'Difficulty': 'Schwierigkeit',
  'Answer options': 'Antwortoptionen',
  'Remember': 'Erinnern',
  'Understand': 'Verstehen',
  'Apply': 'Anwenden',
  'Analyze': 'Analysieren',
  'Easy': 'Einfach',
  'Moderate': 'Mittel',
  'Challenging': 'Anspruchsvoll',
  'Number': 'Anzahl',
  'Number of words': 'Anzahl Wörter',
  'Number of speakers': 'Anzahl Sprechende',
  'Number of statements': 'Anzahl Aussagen',
  'Number of questions': 'Anzahl Fragen',
  'Number of sentences': 'Anzahl Sätze',
  'Number of mini-forms': 'Anzahl Miniformulare',
  'Words': 'Wörter',
  'Blanks': 'Lücken',
  'Include': 'Einbeziehen',
  'Blank focus': 'Lückenfokus',
  'Blanks per sentence': 'Lücken pro Satz',
  'Learner support': 'Lernunterstützung',
  'Text structure': 'Textstruktur',
  'Speakers': 'Sprechende',
  'Name': 'Name',
  'Role': 'Rolle',
  'Demeanor': 'Auftreten',
  '(optional)': '(optional)',
  'Fields': 'Felder',
  'Field label': 'Feldbezeichnung',
  'Generation guidance': 'Hinweise für die Generierung',
  'Add field': 'Feld hinzufügen',
  'Textsorte': 'Textsorte',
  'Text language': 'Textsprache',
  'German': 'Deutsch',
  'English': 'Englisch',
  'Approx. words': 'Ungefähre Wortzahl',
  'Error density': 'Fehlerdichte',
  '1 error per': '1 Fehler pro',
  'words': 'Wörter',
  'Error positions': 'Fehlerpositionen',
  'Mark errors': 'Fehler markieren',
  'Error types': 'Fehlerarten',
  'Select all': 'Alle auswählen',
  'Clear': 'Auswahl aufheben',
  'Generate from topic': 'Aus Thema generieren',
  'Paste original text': 'Originaltext einfügen',
  'Rich Text source': 'Rich-Text-Quelle',
  'Add word-bank distractors': 'Ablenker zur Wortbank hinzufügen',
  'Number of word-bank distractors': 'Anzahl Ablenker in der Wortbank',
  'Allow duplicates': 'Duplikate erlauben',
  'Cognitive processing': 'Kognitive Verarbeitung',
  'Additional difficulty': 'Zusätzliche Schwierigkeit',
  'Literal / verbatim match': 'Wörtliche Übereinstimmung',
  'Paraphrase': 'Paraphrase',
  'Combining information': 'Informationen verknüpfen',
  'Inference': 'Schlussfolgerung',
  'Global / evaluative': 'Global / bewertend',
  'Plausible distractors': 'Plausible Ablenker',
  'Different wording': 'Abweichende Formulierung',
  'Include negation': 'Verneinung einbeziehen',
  'Add Not given': '«Nicht erwähnt» hinzufügen',
  'Scatter answer locations': 'Antwortstellen verteilen',
  'I already have a word list': 'Ich habe bereits eine Wortliste',
  'Subject': 'Fach',
  'Other subject': 'Anderes Fach',
  'Learner stage': 'Lernstufe',
  'Typical age range': 'Typische Altersspanne',
  'Content language': 'Inhaltssprache',
  'More context': 'Weitere Kontextangaben',
  'Country / education system': 'Land / Bildungssystem',
  'Local level': 'Lokale Stufe',
  'Curriculum': 'Lehrplan',
  'Language proficiency': 'Sprachniveau',
  'Learner context': 'Lernkontext',
  'Not specified': 'Nicht angegeben',
  'Early childhood': 'Frühe Kindheit',
  'Primary education': 'Primarstufe',
  'Lower secondary': 'Sekundarstufe I',
  'Upper secondary': 'Sekundarstufe II',
  'Vocational education': 'Berufsbildung',
  'Higher education': 'Hochschulbildung',
  'Adult education': 'Erwachsenenbildung',
  'Professional training': 'Berufliche Weiterbildung',
  'Mixed ages': 'Gemischte Altersgruppen',
  'Not education-specific': 'Nicht bildungsspezifisch',
  'Languages': 'Sprachen',
  'Arts': 'Kunst',
  'Biology': 'Biologie',
  'Chemistry': 'Chemie',
  'Civics': 'Politische Bildung',
  'Computer science': 'Informatik',
  'Economics': 'Wirtschaft',
  'General science': 'Naturwissenschaften',
  'Geography': 'Geografie',
  'History': 'Geschichte',
  'Language arts / Literacy': 'Sprachunterricht / Literalität',
  'Mathematics': 'Mathematik',
  'Music': 'Musik',
  'Physical education': 'Sport',
  'Physics': 'Physik',
  'Social studies': 'Gesellschaftskunde',
  'Vocational studies': 'Berufskunde',
  'Other': 'Andere',
  'to': 'bis',
  'Min': 'Min.',
  'Max': 'Max.',
  'Generate Dialogue with Eduit AI': 'Dialog mit Eduit AI generieren',
  'Generate Error Correction Text with Eduit AI':
    'Fehlerkorrekturtext mit Eduit AI generieren',
  'Generate Fill in the Blank with Eduit AI':
    'Lückentext mit Eduit AI generieren',
  'Generate Mini Forms with Eduit AI':
    'Miniformulare mit Eduit AI generieren',
  'Generate MCQ with Eduit AI':
    'Multiple-Choice-Frage mit Eduit AI generieren',
  'Generate Rich Text with Eduit AI': 'Rich Text mit Eduit AI generieren',
  'Generate True / False with Eduit AI':
    'Richtig/Falsch-Aufgabe mit Eduit AI generieren',
  'Generate Word Grid with Eduit AI':
    'Buchstabengitter mit Eduit AI generieren',
  'Generate Crossword with Eduit AI':
    'Kreuzworträtsel mit Eduit AI generieren',
  'One continuous text': 'Ein zusammenhängender Text',
  'Connected sentences': 'Zusammenhängende Einzelsätze',
  'Independent sentences': 'Unabhängige Einzelsätze',
  'Narrative text': 'Erzähltext',
  'Direct formal address': 'Direkte formelle Ansprache',
  'Direct informal address': 'Direkte informelle Ansprache',
  'Messenger message': 'Messenger-Nachricht',
  'Email': 'E-Mail',
  'Statements closely repeat information from the source.':
    'Die Aussagen wiederholen Informationen aus der Quelle nahezu wörtlich.',
  'The same information is expressed with different wording.':
    'Dieselben Informationen werden anders formuliert.',
  'Learners connect information from multiple parts of the text.':
    'Die Lernenden verknüpfen Informationen aus mehreren Textstellen.',
  'Learners deduce answers from clues rather than explicit statements.':
    'Die Lernenden leiten Antworten aus Hinweisen statt aus direkten Aussagen ab.',
  'Items assess the main idea, intention, tone, or complete text.':
    'Die Aussagen prüfen Hauptaussage, Absicht, Ton oder den Gesamttext.',
  'Recall an explicit fact or detail from the source.':
    'Rufen Sie eine ausdrücklich genannte Tatsache oder Einzelheit aus der Quelle ab.',
  'Interpret or paraphrase information from the source.':
    'Interpretieren oder paraphrasieren Sie Informationen aus der Quelle.',
  'Use source information in a closely related situation.':
    'Wenden Sie Informationen aus der Quelle auf eine eng verwandte Situation an.',
  'Connect details, distinguish relationships, or draw a supported conclusion.':
    'Verknüpfen Sie Einzelheiten, unterscheiden Sie Zusammenhänge oder ziehen Sie eine belegte Schlussfolgerung.',
  'The text will use this linguistic, semantic, pragmatic, or discourse challenge extensively and in varied natural contexts.':
    'Der Text greift diese sprachliche, semantische, pragmatische oder diskursive Herausforderung ausführlich und in vielfältigen natürlichen Kontexten auf.',
  'Add a Rich Text block or choose another source.':
    'Fügen Sie einen Rich-Text-Block hinzu oder wählen Sie eine andere Quelle.',
  'Add a Rich Text block or choose another source option.':
    'Fügen Sie einen Rich-Text-Block hinzu oder wählen Sie eine andere Quellenoption.',
  'Add a Rich Text block or switch to Paste text.':
    'Fügen Sie einen Rich-Text-Block hinzu oder wechseln Sie zu «Text einfügen».',
  'Search subjects': 'Fächer suchen',
  'Enter the subject': 'Fach eingeben',
  'Relevant needs, prior knowledge, or learning situation':
    'Relevante Bedürfnisse, Vorkenntnisse oder Lernsituation',
  'Name or curriculum code': 'Name oder Lehrplancode',
  'Select a Rich Text block…': 'Rich-Text-Block auswählen…',
  'Textsorte wählen…': 'Textsorte wählen…',
  'What should the dialogue be about?': 'Worum soll es im Dialog gehen?',
  'What should the text be about?': 'Worum soll es im Text gehen?',
  'What should learners practise?': 'Was sollen die Lernenden üben?',
  'What information should learners extract?':
    'Welche Informationen sollen die Lernenden entnehmen?',
  'What should the word grid be about?':
    'Worum soll es im Buchstabengitter gehen?',
  'One word per line': 'Ein Wort pro Zeile',
  'What should the source text and question be about?':
    'Worum soll es im Quelltext und in der Frage gehen?',
  'What value should AI provide?': 'Welchen Wert soll die KI liefern?',
  'e.g. key vocabulary, verb forms, polite phrases':
    'z. B. Schlüsselwortschatz, Verbformen, höfliche Wendungen',
  'e.g. modal verbs, appointment vocabulary, prepositions':
    'z. B. Modalverben, Wortschatz zu Terminen, Präpositionen',
  'e.g. customer': 'z. B. Kundin oder Kunde',
  'e.g. patient': 'z. B. geduldig',
  'e.g. German (de-CH)': 'z. B. Deutsch (de-CH)',
  'e.g. Switzerland': 'z. B. Schweiz',
  'e.g. Sekundarstufe I': 'z. B. Sekundarstufe I',
  'e.g. CEFR A2': 'z. B. GER A2',
  'Paste the correct source text…': 'Fügen Sie den korrekten Quelltext ein…',
  'Paste the original text. AI will preserve it and add blanks…':
    'Fügen Sie den Originaltext ein. Die KI übernimmt ihn und ergänzt Lücken…',
  'Paste the source text used to generate the statements…':
    'Fügen Sie den Quelltext ein, aus dem die Aussagen generiert werden…',
  'Paste the source text used to generate the question…':
    'Fügen Sie den Quelltext ein, aus dem die Frage generiert werden soll…',
  'e.g. separable verbs, temporal sequence, distinguishing cause and consequence, formal register…':
    'z. B. trennbare Verben, zeitliche Abfolge, Unterscheidung von Ursache und Folge, formelles Register…',
  'Could not generate the dialogue.': 'Der Dialog konnte nicht generiert werden.',
  'Could not generate the error text.':
    'Der Fehlertext konnte nicht generiert werden.',
  'Could not generate the fill-in-the-blank activity.':
    'Die Lückentextaufgabe konnte nicht generiert werden.',
  'Could not generate the mini-forms.':
    'Die Miniformulare konnten nicht generiert werden.',
  'Could not generate the text.': 'Der Text konnte nicht generiert werden.',
  'Could not generate the activity.':
    'Die Aufgabe konnte nicht generiert werden.',
  'Could not generate the word grid.':
    'Das Buchstabengitter konnte nicht generiert werden.',
  'Could not generate the MCQ.':
    'Die Multiple-Choice-Frage konnte nicht generiert werden.',
  'Enter a topic for the dialogue.':
    'Geben Sie ein Thema für den Dialog ein.',
  'Enter a topic for the text.': 'Geben Sie ein Thema für den Text ein.',
  'Enter a topic for the activity.':
    'Geben Sie ein Thema für die Aufgabe ein.',
  'Enter a topic or scenario for the mini-forms.':
    'Geben Sie ein Thema oder Szenario für die Miniformulare ein.',
  'Enter a topic or draft title.':
    'Geben Sie ein Thema oder einen Arbeitstitel ein.',
  'Enter a topic for the word grid.':
    'Geben Sie ein Thema für das Buchstabengitter ein.',
  'Enter a topic for the source text.':
    'Geben Sie ein Thema für den Quelltext ein.',
  'Enter a name and role for every speaker.':
    'Geben Sie für alle Sprechenden einen Namen und eine Rolle ein.',
  'Enter a label for every field.':
    'Geben Sie für jedes Feld eine Bezeichnung ein.',
  'Select a Rich Text source from this worksheet.':
    'Wählen Sie eine Rich-Text-Quelle aus diesem Arbeitsblatt.',
  'Paste the correct source text.': 'Fügen Sie den korrekten Quelltext ein.',
  'Paste the original text to enhance with blanks.':
    'Fügen Sie den Originaltext ein, der mit Lücken ergänzt werden soll.',
  'Paste a source text for this activity.':
    'Fügen Sie einen Quelltext für diese Aufgabe ein.',
  'Paste a source text for this question.':
    'Fügen Sie einen Quelltext für diese Frage ein.',
  'Provide or select a source text.':
    'Geben Sie einen Quelltext ein oder wählen Sie einen aus.',
  'Choose a Textsorte.': 'Wählen Sie eine Textsorte.',
  'Select at least one error type.':
    'Wählen Sie mindestens eine Fehlerart aus.',
  'Use at least three statements when Not given is enabled.':
    'Verwenden Sie mindestens drei Aussagen, wenn «Nicht erwähnt» aktiviert ist.',
  'Generation took too long. Please try again with a shorter source text.':
    'Die Generierung hat zu lange gedauert. Versuchen Sie es erneut mit einem kürzeren Quelltext.',
  'The text was generated, but the selected block could not be updated.':
    'Der Text wurde generiert, der ausgewählte Block konnte jedoch nicht aktualisiert werden.',
  'The activity was generated, but the selected Fill in the Blank block could not be updated.':
    'Die Aufgabe wurde generiert, der ausgewählte Lückentext-Block konnte jedoch nicht aktualisiert werden.',
  'The question was generated, but the selected MCQ block could not be updated.':
    'Die Frage wurde generiert, der ausgewählte Multiple-Choice-Block konnte jedoch nicht aktualisiert werden.',
  'The generated item did not pass the quality review.':
    'Die generierte Frage hat die Qualitätsprüfung nicht bestanden.',
  'The model returned an unexpected number of answer options.':
    'Das Modell hat eine unerwartete Anzahl Antwortoptionen zurückgegeben.',
  'The model returned an unexpected number of questions.':
    'Das Modell hat eine unerwartete Anzahl Fragen zurückgegeben.',
  'The model returned duplicate questions.':
    'Das Modell hat identische oder nahezu identische Fragen zurückgegeben.',
  'The model returned duplicate or near-duplicate options.':
    'Das Modell hat identische oder nahezu identische Antwortoptionen zurückgegeben.',
  'The model returned an all/none-of-the-above option.':
    'Das Modell hat eine Antwortoption vom Typ «Alle/Keine der genannten Antworten» zurückgegeben.',
  'The answer options are not sufficiently homogeneous.':
    'Die Antwortoptionen sind nicht ausreichend einheitlich.',
  'The correct answer is identifiable by its length.':
    'Die richtige Antwort ist aufgrund ihrer Länge erkennbar.',
  'The key evidence could not be verified against the source.':
    'Der Beleg für die richtige Antwort konnte nicht anhand der Quelle überprüft werden.',
};

const DE_TO_EN = Object.fromEntries(
  Object.entries(EN_TO_DE).map(([english, german]) => [german, english]),
);

function translateDynamic(value: string, locale: 'en' | 'de') {
  if (locale === 'de') {
    const speakers = value.match(/^(\d+) speakers$/);
    if (speakers) return `${speakers[1]} Sprechende`;
    const fields = value.match(/^(\d+) fields$/);
    if (fields) return `${fields[1]} Felder`;
  } else {
    const speakers = value.match(/^(\d+) Sprechende$/);
    if (speakers) return `${speakers[1]} speakers`;
    const fields = value.match(/^(\d+) Felder$/);
    if (fields) return `${fields[1]} fields`;
  }
  return value;
}

function translateValue(value: string, locale: 'en' | 'de') {
  const translated = locale === 'de'
    ? EN_TO_DE[value]
    : DE_TO_EN[value];
  return translated ?? translateDynamic(value, locale);
}

function translateRoot(root: HTMLElement, locale: 'en' | 'de') {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const value = current.nodeValue ?? '';
    const trimmed = value.trim();
    if (trimmed) {
      const normalized = trimmed.replace(/\s+/g, ' ');
      const translated = translateValue(normalized, locale);
      if (translated !== normalized) {
        current.nodeValue = value.replace(trimmed, translated);
      }
    }
    current = walker.nextNode();
  }

  [root, ...root.querySelectorAll<HTMLElement>('*')].forEach((element) => {
    ['aria-label', 'placeholder', 'title'].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      const translated = translateValue(value, locale);
      if (translated !== value) element.setAttribute(attribute, translated);
    });
  });
}

export function useAIModalLocalization(
  rootRef: RefObject<HTMLElement | null>,
  open: boolean,
) {
  const { locale } = useI18n();

  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    let translating = false;
    const translate = () => {
      if (translating) return;
      translating = true;
      translateRoot(root, locale);
      translating = false;
    };
    translate();
    const observer = new MutationObserver(translate);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['aria-label', 'placeholder', 'title'],
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [locale, open, rootRef]);
}
