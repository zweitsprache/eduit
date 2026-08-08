import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { VerbParts, VerbPartsProps } from './VerbParts';

/**
 * Remotion adapter: reads frame/fps/size from Remotion context and hands them
 * to the pure <VerbParts /> renderer. Keep the two separate so the pure
 * component stays mountable outside Remotion (e.g. inside a video editor).
 */
export const VerbPartsRemotion: React.FC<Omit<VerbPartsProps, 'frame' | 'fps' | 'width' | 'height'>> = (props) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  return (
    <VerbParts
      {...props}
      frame={frame}
      fps={fps}
      width={width}
      height={height}
      durationInFrames={durationInFrames}
    />
  );
};

export default VerbPartsRemotion;
