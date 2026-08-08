import React from 'react';
import { Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/EncodeSansSemiCondensed';
import { VerbPartsRemotion } from './VerbPartsRemotion';
import { verbPartsTemplate } from './manifest';

const { fontFamily } = loadFont();

export const RemotionRoot: React.FC = () => (
  <Composition
    id="VerbParts"
    component={VerbPartsRemotion}
    durationInFrames={verbPartsTemplate.durationInFrames}
    fps={verbPartsTemplate.fps}
    width={verbPartsTemplate.width}
    height={verbPartsTemplate.height}
    defaultProps={{ ...verbPartsTemplate.defaultProps, fontFamily }}
  />
);
