import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { StickerTemplate, StickerTemplateProps } from "../base-template";
import { VerbParts, VerbPartsProps } from "./VerbParts";

interface VerbPartsStickerProps
  extends StickerTemplateProps,
    Pick<VerbPartsProps, "stem" | "showLogo" | "backgroundColor" | "fontFamily"> {}

/**
 * Sticker-template adapter: reads frame/fps from Remotion context (same as
 * every other sticker template) and hands them, plus the overlay's size,
 * to the pure <VerbParts /> renderer.
 */
const VerbPartsStickerComponent: React.FC<VerbPartsStickerProps> = ({
  overlay,
  stem = "koch",
  showLogo = true,
  backgroundColor = "#ffffff",
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <VerbParts
      frame={frame}
      fps={fps}
      durationInFrames={overlay.durationInFrames}
      width={overlay.width}
      height={overlay.height}
      stem={stem}
      showLogo={showLogo}
      backgroundColor={backgroundColor}
      {...(fontFamily !== undefined && { fontFamily })}
    />
  );
};

export const verbPartsSticker: StickerTemplate = {
  config: {
    id: "dazit-verbteile-stamm-endung",
    name: "Verbteile – Stamm und Endung",
    category: "Default",
    layout: "single",
    defaultProps: {
      stem: "koch",
      showLogo: true,
      backgroundColor: "#ffffff",
    },
  },
  Component: VerbPartsStickerComponent,
};

export default verbPartsSticker;
