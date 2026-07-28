export type ErrorCorrectionLanguage = 'german' | 'english';

export type ErrorTypeDefinition = {
  id: string;
  label: string;
  description: string;
  example: string;
};

export type ErrorTypeGroup = {
  label: string;
  types: ErrorTypeDefinition[];
};

export const ERROR_CORRECTION_TYPES: Record<
  ErrorCorrectionLanguage,
  ErrorTypeGroup[]
> = {
  german: [
    {
      label: 'Morphologie / Flexion',
      types: [
        { id: 'de-case', label: 'Kasusfehler', description: 'Falscher Fall nach Präposition oder Verb', example: 'mit dem Auto → mit das Auto' },
        { id: 'de-gender', label: 'Genusfehler', description: 'Falscher Artikel', example: 'der Tisch → die Tisch' },
        { id: 'de-number', label: 'Numerusfehler', description: 'Falsche Pluralbildung oder Subjekt-Verb-Kongruenz', example: 'Die Kinder spielen → Die Kinder spielt' },
        { id: 'de-conjugation', label: 'Verbkonjugation', description: 'Falsche Personalendung oder falscher Stammvokal', example: 'Er nimmt → Er nehmt' },
        { id: 'de-adjective', label: 'Adjektivdeklination', description: 'Falsche Adjektivendung', example: 'der grosse Hund → der grosser Hund' },
      ],
    },
    {
      label: 'Syntax / Satzbau',
      types: [
        { id: 'de-main-order', label: 'Wortstellung im Hauptsatz', description: 'Verb nicht an Position 2', example: 'Heute gehe ich → Heute ich gehe' },
        { id: 'de-subordinate-order', label: 'Wortstellung im Nebensatz', description: 'Verb nicht am Satzende', example: 'weil ich krank bin → weil ich bin krank' },
        { id: 'de-verb-bracket', label: 'Verbklammer', description: 'Trennbare Verben nicht korrekt getrennt', example: 'Ich rufe dich an → Ich anrufe dich' },
        { id: 'de-question-inversion', label: 'Inversion bei Fragen', description: 'Fehlende oder falsche Inversion', example: 'Kommst du morgen? → Du kommst morgen?' },
      ],
    },
    {
      label: 'Präpositionen',
      types: [
        { id: 'de-preposition', label: 'Falsche Präposition', description: 'Unpassende Präposition', example: 'auf den Bus warten → für den Bus warten' },
        { id: 'de-preposition-case', label: 'Präposition mit falschem Kasus', description: 'Falscher Kasus nach Präposition', example: 'mit dem Auto → mit das Auto' },
      ],
    },
    {
      label: 'Pronomen',
      types: [
        { id: 'de-pronoun-case', label: 'Personalpronomen: Kasus', description: 'Falscher Kasus des Personalpronomens', example: 'Ich sehe ihn → Ich sehe er' },
        { id: 'de-reflexive', label: 'Reflexivpronomen', description: 'Reflexivpronomen fehlt oder ist falsch', example: 'Ich freue mich → Ich freue' },
        { id: 'de-possessive', label: 'Possessivpronomen', description: 'Possessivpronomen falsch dekliniert', example: 'mit meinem Bruder → mit mein Bruder' },
      ],
    },
    {
      label: 'Tempus / Modus',
      types: [
        { id: 'de-tense', label: 'Falsches Tempus', description: 'Tempus passt nicht zum Zeitkontext', example: 'Gestern bin ich gegangen → Gestern gehe ich' },
        { id: 'de-auxiliary', label: 'Hilfsverb haben/sein', description: 'Falsches Hilfsverb', example: 'Ich bin gefahren → Ich habe gefahren' },
        { id: 'de-participle', label: 'Partizip II', description: 'Partizip II falsch gebildet', example: 'gegessen → gegesst' },
      ],
    },
    {
      label: 'Orthografie',
      types: [
        { id: 'de-capitalization', label: 'Gross-/Kleinschreibung', description: 'Nomen oder Satzanfang falsch geschrieben', example: 'das Haus → das haus' },
        { id: 'de-compounds', label: 'Getrennt-/Zusammenschreibung', description: 'Wortverbindungen falsch getrennt oder verbunden', example: 'Fahrrad → Fahr Rad' },
        { id: 'de-umlaut', label: 'Umlaute', description: 'Umlaut ausgelassen oder ersetzt', example: 'können → konnen' },
      ],
    },
    {
      label: 'Wortschatz / Lexik',
      types: [
        { id: 'de-word-confusion', label: 'Ähnliche Wörter', description: 'Verwechslung ähnlich klingender oder geschriebener Wörter', example: 'seit → seid' },
        { id: 'de-collocation', label: 'Kollokationen', description: 'Unübliche Wortverbindung', example: 'Hausaufgaben machen → Hausaufgaben tun' },
      ],
    },
  ],
  english: [
    {
      label: 'Morphology / Inflection',
      types: [
        { id: 'en-agreement', label: 'Subject-verb agreement', description: 'Wrong verb form for the subject', example: 'She works → She work' },
        { id: 'en-plural', label: 'Plural formation', description: 'Missing or incorrect plural marker', example: 'three books → three book' },
        { id: 'en-tense-marking', label: 'Tense/aspect marking', description: 'Wrong or missing tense ending', example: 'He walked → He walks' },
        { id: 'en-irregular', label: 'Irregular verb forms', description: 'Regularized irregular form', example: 'went → goed' },
        { id: 'en-comparison', label: 'Comparative/superlative', description: 'Incorrect comparison form', example: 'more beautiful → beautifuller' },
      ],
    },
    {
      label: 'Syntax / Word Order',
      types: [
        { id: 'en-adjective-order', label: 'Adjective order', description: 'Incorrect sequencing of adjectives', example: 'big red car → red big car' },
        { id: 'en-question', label: 'Question formation', description: 'Missing or incorrect auxiliary inversion', example: 'Where are you going? → Where you are going?' },
        { id: 'en-adverb', label: 'Adverb placement', description: 'Frequency or manner adverb in the wrong position', example: 'I always eat → I eat always' },
        { id: 'en-embedded-order', label: 'Embedded-clause order', description: 'Question order incorrectly retained in an embedded clause', example: 'where he lives → where does he live' },
      ],
    },
    {
      label: 'Articles',
      types: [
        { id: 'en-article-missing', label: 'Missing article', description: 'Required article omitted', example: 'I saw a dog → I saw dog' },
        { id: 'en-article-choice', label: 'Wrong article', description: 'Incorrect a, an, or the', example: 'an apple → a apple' },
        { id: 'en-article-extra', label: 'Unnecessary article', description: 'Article used where none is required', example: 'I like music → I like the music' },
      ],
    },
    {
      label: 'Prepositions',
      types: [
        { id: 'en-preposition-wrong', label: 'Wrong preposition', description: 'Incorrect preposition choice', example: 'married to → married with' },
        { id: 'en-preposition-missing', label: 'Missing preposition', description: 'Required preposition omitted', example: 'listen to music → listen music' },
        { id: 'en-preposition-extra', label: 'Unnecessary preposition', description: 'Unneeded preposition inserted', example: 'discuss the problem → discuss about the problem' },
      ],
    },
    {
      label: 'Pronouns',
      types: [
        { id: 'en-pronoun-case', label: 'Pronoun case', description: 'Subject/object case confusion', example: 'between you and me → between you and I' },
        { id: 'en-possessive', label: 'Possessive marker', description: 'Possessive marker missing', example: "my brother's car → my brother car" },
        { id: 'en-reflexive', label: 'Reflexive pronouns', description: 'Incorrect reflexive form', example: 'I hurt myself → I hurt me' },
      ],
    },
    {
      label: 'Tense / Aspect / Modality',
      types: [
        { id: 'en-tense', label: 'Wrong tense choice', description: 'Tense does not fit meaning or time context', example: 'I have lived here for years → I live here for years' },
        { id: 'en-auxiliary', label: 'Missing auxiliary', description: 'Required auxiliary omitted', example: 'She is working → She working' },
        { id: 'en-modal', label: 'Modal verbs', description: 'Inflection or infinitive error after modal', example: 'He can swim → He cans swim' },
        { id: 'en-conditional', label: 'Conditional structures', description: 'Incorrect conditional form', example: 'If I were rich → If I was rich' },
      ],
    },
    {
      label: 'Spelling',
      types: [
        { id: 'en-homophone', label: 'Homophones', description: 'Confusion of words with the same sound', example: 'their → there' },
        { id: 'en-doubled-consonant', label: 'Doubled consonants', description: 'Required doubled consonant omitted or added', example: 'running → runing' },
        { id: 'en-silent-letter', label: 'Silent letters', description: 'Silent letter omitted', example: 'knife → nife' },
      ],
    },
    {
      label: 'Vocabulary / Lexis',
      types: [
        { id: 'en-word-confusion', label: 'Near-synonym confusion', description: 'Semantically related words confused', example: 'make a mistake → do a mistake' },
        { id: 'en-collocation', label: 'Collocations', description: 'Unnatural word combination', example: 'heavy rain → strong rain' },
        { id: 'en-countability', label: 'Countable/uncountable nouns', description: 'Incorrect countability marking', example: 'some advice → some advices' },
      ],
    },
  ],
};

export function errorTypeById(id: string) {
  return Object.values(ERROR_CORRECTION_TYPES)
    .flatMap((groups) => groups.flatMap(({ types }) => types))
    .find((type) => type.id === id);
}
