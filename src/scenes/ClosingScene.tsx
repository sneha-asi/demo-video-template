import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BG, TEXT_PRIMARY, TEXT_MUTED, ACCENT, ACCENT_SOFT, FONT } from "../constants";
import { BRAND } from "../config";

// 5-second close: headline → sub-headline → branded pill.

export const ClosingScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: f,           fps, config: { damping: 18, stiffness: 200 } });
  const sub  = spring({ frame: Math.max(0, f - 30), fps, config: { damping: 20, stiffness: 200 } });
  const cta  = spring({ frame: Math.max(0, f - 60), fps, config: { damping: 20, stiffness: 180, mass: 1.2 } });
  const exit = interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      background: BG, alignItems: "center", justifyContent: "center", gap: 28,
      fontFamily: FONT,
    }}>
      <p style={{
        color: TEXT_PRIMARY, fontSize: 84, fontWeight: 700, margin: 0,
        textAlign: "center", lineHeight: 1.1, maxWidth: 1500, letterSpacing: -1,
        opacity: Math.min(head, exit), transform: `translateY(${(1 - head) * 26}px)`,
      }}>
        {BRAND.closingHead}
      </p>
      <p style={{
        color: TEXT_MUTED, fontSize: 36, margin: 0, textAlign: "center",
        opacity: Math.min(sub, exit), transform: `translateY(${(1 - sub) * 14}px)`,
        letterSpacing: "0.04em", maxWidth: 1200,
      }}>
        {BRAND.closingSub}
      </p>
      <div style={{
        marginTop: 16, padding: "20px 56px", borderRadius: 16,
        background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SOFT})`,
        opacity: Math.min(cta, exit),
        transform: `scale(${interpolate(cta, [0, 1], [0.88, 1])})`,
      }}>
        <span style={{ color: "#fff", fontSize: 32, fontWeight: 700, letterSpacing: "0.02em" }}>
          {BRAND.closingPill}
        </span>
      </div>
    </AbsoluteFill>
  );
};
