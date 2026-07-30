import a11 from '../../public/language_levels/DE/01_A1.1.json';
import a12 from '../../public/language_levels/DE/02_A1.2.json';
import a21 from '../../public/language_levels/DE/03_A2.1.json';
import a22 from '../../public/language_levels/DE/04_A2.2.json';
import b11 from '../../public/language_levels/DE/05_B1.1.json';
import b12 from '../../public/language_levels/DE/06_B1.2.json';

export const GERMAN_PROGRESSION_LEVELS = [
  'A1.1',
  'A1.2',
  'A2.1',
  'A2.2',
  'B1.1',
  'B1.2',
] as const;

export const GERMAN_PROGRESSION_PHASES = [
  'beginning',
  'middle',
  'towards-end',
  'completed',
] as const;

export type GermanProgressionLevel =
  typeof GERMAN_PROGRESSION_LEVELS[number];
export type GermanProgressionPhase =
  typeof GERMAN_PROGRESSION_PHASES[number];
export type GermanProgressionSelection = {
  level: GermanProgressionLevel;
  phase: GermanProgressionPhase;
};
export type GermanProgressionArtifact =
  | 'crossword-clue'
  | 'continuous-text'
  | 'mcq-stem'
  | 'mcq-option';

type ProgressionProfile = {
  vorausgesetzt: string[];
  textmerkmale: {
    satzlaenge_woerter: number[];
    nebensaetze_pro_satz_max: number;
    mehrfacheinbettung: boolean;
    nominalstil: boolean;
    ausgeschlossen: string[];
  };
  phasen: Array<{
    bezeichnung: string;
    neu: string[];
    noch_vermeiden: string[];
    beispielsaetze: string[];
  }>;
};

const PROFILES: Record<GermanProgressionLevel, ProgressionProfile> = {
  'A1.1': a11,
  'A1.2': a12,
  'A2.1': a21,
  'A2.2': a22,
  'B1.1': b11,
  'B1.2': b12,
};

function isGerman(contentLanguage: string) {
  return /\b(?:de(?:-[a-z]{2})?|german|deutsch)\b/i.test(contentLanguage);
}

function phaseIndex(phase: GermanProgressionPhase) {
  return GERMAN_PROGRESSION_PHASES.indexOf(phase);
}

export function stepBackGermanProgression(
  selection: GermanProgressionSelection,
): GermanProgressionSelection {
  const currentPhase = phaseIndex(selection.phase);
  if (currentPhase > 0) {
    return {
      level: selection.level,
      phase: GERMAN_PROGRESSION_PHASES[currentPhase - 1],
    };
  }
  const currentLevel = GERMAN_PROGRESSION_LEVELS.indexOf(selection.level);
  if (currentLevel <= 0) return selection;
  return {
    level: GERMAN_PROGRESSION_LEVELS[currentLevel - 1],
    phase: 'towards-end',
  };
}

export function germanProgressionInstruction({
  artifact,
  contentLanguage,
  languageDifficulty = 'default',
  selection,
}: {
  artifact: GermanProgressionArtifact;
  contentLanguage: string;
  languageDifficulty?: 'default' | 'slightly-easier';
  selection?: GermanProgressionSelection;
}) {
  if (!selection || !isGerman(contentLanguage)) return '';
  const effectiveSelection = languageDifficulty === 'slightly-easier'
    ? stepBackGermanProgression(selection)
    : selection;
  const profile = PROFILES[effectiveSelection.level];
  const completed = effectiveSelection.phase === 'completed';
  const selectedPhaseIndex = completed
    ? profile.phasen.length - 1
    : phaseIndex(effectiveSelection.phase);
  const selectedPhase = profile.phasen[selectedPhaseIndex];
  const availableGrammar = [
    ...profile.vorausgesetzt,
    ...profile.phasen
      .slice(0, selectedPhaseIndex + 1)
      .flatMap(({ neu }) => neu),
  ];
  const avoid = [
    ...profile.textmerkmale.ausgeschlossen,
    ...(completed ? [] : selectedPhase.noch_vermeiden),
  ];
  const [minimumWords, maximumWords] =
    profile.textmerkmale.satzlaenge_woerter;
  const artifactRule = {
    'continuous-text': `Keep prose sentences normally within ${minimumWords}–${maximumWords}
words and use at most ${profile.textmerkmale.nebensaetze_pro_satz_max}
subordinate clause(s) per sentence.`,
    'crossword-clue': `Keep clues concise. Blank-sentence clues may be shorter
than the prose range, but their grammar must remain within this progression.`,
    'mcq-stem': `Keep question stems direct and grammatically within this
progression. Do not increase linguistic complexity to create logical difficulty.`,
    'mcq-option': `Keep all options parallel, concise, and grammatically within
this progression.`,
  }[artifact];

  return `Detailed German progression — mandatory:
- Effective target: ${effectiveSelection.level}, ${
    completed ? 'sublevel completed' : selectedPhase.bezeichnung
  }.
- Artifact: ${artifact}.
- ${artifactRule}
- Multiple embedding: ${
    profile.textmerkmale.mehrfacheinbettung ? 'allowed' : 'not allowed'
  }.
- Nominal style: ${
    profile.textmerkmale.nominalstil ? 'allowed' : 'avoid'
  }.

Grammar available at this point:
${availableGrammar.map((item) => `- ${item}`).join('\n')}

Grammar and structures not yet allowed:
${avoid.length
    ? avoid.map((item) => `- ${item}`).join('\n')
    : '- No phase-specific additions beyond the profile constraints.'}

Style models (use only as grammar models; never copy their content):
${selectedPhase.beispielsaetze.map((sentence) => `- ${sentence}`).join('\n')}

Before returning learner-facing language, silently revise every sentence that
uses a not-yet-allowed structure.`;
}
