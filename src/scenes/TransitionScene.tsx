import React from "react";
import { AbsoluteFill, Video, staticFile } from "remotion";

/**
 * Plays a transparent-background shader transition mp4 rendered by
 * `npm run transition -- <name>` (which lives in public/transitions/).
 *
 * This is the opt-in Hyperframes integration: catalog blocks like
 * `flash-through-white`, `prism-shift`, etc. are rendered out as standalone
 * mp4s and composited into the Remotion timeline as a Video clip.
 *
 * Used by TemplateComposition.tsx between acts when an act sets a
 * `transitionIn` in config.ts (future), or you can wire it manually.
 */
export const TransitionScene: React.FC<{
  name: string;                  // e.g. "flash-through-white"
  durationInFrames: number;      // typically 30 (1s @30fps)
}> = ({ name }) => {
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <Video
        src={staticFile(`transitions/${name}.mp4`)}
        // Transparent mp4s (ProRes 4444 or VP9 with alpha) — Remotion respects alpha.
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        muted
      />
    </AbsoluteFill>
  );
};
