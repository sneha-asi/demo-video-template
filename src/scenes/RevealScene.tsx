import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BG, TEXT_PRIMARY, TEXT_MUTED, ACCENT, FONT } from "../constants";
import { BRAND } from "../config";

// 3-second brand reveal — wordmark + one-line tagline.

export const RevealScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wordOn = spring({ frame: f, fps, config: { damping: 18, stiffness: 200 } });
  const subOn  = spring({ frame: Math.max(0, f - 18), fps, config: { damping: 22, stiffness: 200 } });
  const exit  = interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      background: BG, alignItems: "center", justifyContent: "center",
      fontFamily: FONT,
    }}>
      <div style={{
        fontSize: 220, fontWeight: 800, letterSpacing: -5, lineHeight: 1, textAlign: "center",
        opacity: Math.min(wordOn, exit), transform: `translateY(${(1 - wordOn) * 24}px)`,
      }}>
        <span style={{ color: TEXT_PRIMARY }}>{BRAND.wordmark.primary}</span>
        <span style={{ color: ACCENT }}>{BRAND.wordmark.accent}</span>
      </div>
      <div style={{
        marginTop: 32, fontSize: 44, color: TEXT_MUTED, textAlign: "center", maxWidth: 1200,
        opacity: Math.min(subOn, exit), transform: `translateY(${(1 - subOn) * 12}px)`,
      }}>
        {BRAND.tagline}
      </div>
    </AbsoluteFill>
  );
};
