/** Structured cue list, exported from code (replaces the old window.OM_SCENES). */

export interface Scene {
  id: string;
  name: string;
  /** seconds from the start of the composition */
  start: number;
  /** seconds */
  duration: number;
  description: string;
}

export const SCENES: Scene[] = [
  {
    id: 'teile',
    name: 'Teile',
    start: 0,
    duration: 5,
    description:
      'Das Stamm-Puzzleteil kommt von links, das Endung-Teil von rechts und rastet ein.',
  },
  {
    id: 'beispiele',
    name: 'Beispiele',
    start: 5,
    duration: 9,
    description:
      'Das Paar wird klein und wird zu koch + en, darunter erscheinen wohn + en und lern + en.',
  },
  {
    id: 'konjugation',
    name: 'Konjugation',
    start: 14,
    duration: 28,
    description:
      'Ein Pronomen-Teil kommt von links: ich, du, er / sie / es. Pro Pronomen wechselt nur der Stamm durch koch, wohn, lern; die Endung bleibt.',
  },
];

/** Cue offsets in seconds, derived from SCENES — the animation keys off these. */
export const CUES: Record<string, number> = SCENES.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.start }),
  {}
);

export const TOTAL_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);

export const DEFAULT_FPS = 30;
export const DURATION_IN_FRAMES = Math.round(TOTAL_SECONDS * DEFAULT_FPS);
