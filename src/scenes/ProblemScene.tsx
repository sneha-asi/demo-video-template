import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { BG, ACCENT, ACCENT_DEEP, TEXT_PRIMARY, TEXT_MUTED, FONT } from "../constants";
import { PROBLEM_LINES } from "../config";

// Renders each PROBLEM_LINE in sequence, equal share of total duration.
// Each line fades up, lingers, fades down.

export const ProblemScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const f = useCurrentFrame();
  const per = Math.floor(durationInFrames / PROBLEM_LINES.length);
  const idx = Math.min(Math.floor(f / per), PROBLEM_LINES.length - 1);
  const localF = f - idx * per;
  const line = PROBLEM_LINES[idx];
  const enter = interpolate(localF, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit  = interpolate(localF, [per - 14, per], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = Math.min(enter, exit);

  const colorMap: Record<string, string> = { ACCENT, ACCENT_DEEP, TEXT_PRIMARY };
  const punchColor = line.punchColor ? colorMap[line.punchColor] : TEXT_PRIMARY;

  return (
    <AbsoluteFill style={{
      background: BG, alignItems: "center", justifyContent: "center",
      padding: 120, fontFamily: FONT,
    }}>
      <div style={{ opacity: o, transform: `translateY(${(1 - enter) * 18}px)`, textAlign: "center" }}>
        {line.lead && (
          <div style={{ fontSize: 40, color: TEXT_MUTED, marginBottom: 28 }}>
            {line.lead}
          </div>
        )}
        <div style={{
          fontSize: 132, fontWeight: 800, color: punchColor,
          letterSpacing: -2, lineHeight: 1.05, maxWidth: 1500,
        }}>
          {line.punch}
        </div>
      </div>
    </AbsoluteFill>
  );
};
