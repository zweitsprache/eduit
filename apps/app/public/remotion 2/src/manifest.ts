import { SCENES, TOTAL_SECONDS, DEFAULT_FPS, DURATION_IN_FRAMES } from './scenes';
import type { VerbPartsProps } from './VerbParts';

export interface TemplateControl {
  key: keyof VerbPartsProps;
  label: string;
  type: 'text' | 'boolean' | 'color';
  default: string | boolean;
  description?: string;
}

export interface TemplateManifest {
  id: string;
  name: string;
  description: string;
  aspectRatio: string;
  width: number;
  height: number;
  fps: number;
  durationInSeconds: number;
  durationInFrames: number;
  defaultProps: Partial<VerbPartsProps>;
  controls: TemplateControl[];
  scenes: typeof SCENES;
  thumbnail: string;
  tags: string[];
}

export const verbPartsTemplate: TemplateManifest = {
  id: 'dazit-verbteile-stamm-endung',
  name: 'Verbteile – Stamm und Endung',
  description:
    'Puzzleteile erklären den Aufbau deutscher Verben: Stamm plus Endung, dann die Konjugation für ich, du und er / sie / es.',
  aspectRatio: '16:9',
  width: 1920,
  height: 1080,
  fps: DEFAULT_FPS,
  durationInSeconds: TOTAL_SECONDS,
  durationInFrames: DURATION_IN_FRAMES,
  defaultProps: {
    stem: 'koch',
    showLogo: true,
    backgroundColor: '#ffffff',
  },
  controls: [
    {
      key: 'stem',
      label: 'Verbstamm',
      type: 'text',
      default: 'koch',
      description: 'Der Stamm auf dem blauen Puzzleteil, z. B. koch, mach, sag.',
    },
    { key: 'showLogo', label: 'Logo einblenden', type: 'boolean', default: true },
    { key: 'backgroundColor', label: 'Hintergrund', type: 'color', default: '#ffffff' },
  ],
  scenes: SCENES,
  thumbnail: '/templates/verbteile-thumbnail.png',
  tags: ['daz', 'grammatik', 'verben', 'erklärvideo'],
};

export default verbPartsTemplate;
