import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { BG, TEXT_PRIMARY, FONT } from "../constants";
import { SHIFT_PUNCH } from "../config";

// 3-second hook between Problem and Reveal. One short line in the middle.

export const ShiftScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 18, stiffness: 200 } });
  const exit  = interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const o = Math.min(enter, exit);

  return (
    <AbsoluteFill style={{
      background: BG, alignItems: "center", justifyContent: "center",
      padding: 120, fontFamily: FONT,
    }}>
      <div style={{
        fontSize: 124, fontWeight: 800, color: TEXT_PRIMARY,
        letterSpacing: -2, lineHeight: 1.05, textAlign: "center", maxWidth: 1500,
        opacity: o, transform: `translateY(${(1 - enter) * 18}px)`,
      }}>
        {SHIFT_PUNCH}
      </div>
    </AbsoluteFill>
  );
};
