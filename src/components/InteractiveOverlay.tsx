import React from "react";
import { useVideoConfig, spring, interpolate } from "remotion";
import { FONT } from "../constants";

export type Hotspot = {
  frame:  number;
  x:      number;
  y:      number;
  zoom:   number;
  camX?:  number;
  camY?:  number;
  w?:     number;
  h?:     number;
  label?: string;
  color?: string;
  click?: boolean;
  punch?: boolean;
};

export const Cursor: React.FC<{
  x: number; y: number; clicking: boolean; elapsed: number;
}> = ({ x, y, clicking, elapsed }) => {
  const { fps } = useVideoConfig();
  const ripple = clicking
    ? spring({ frame: elapsed, fps, config: { damping: 18, stiffness: 300, mass: 0.4 }, from: 0, to: 1 })
    : 0;

  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 200 }}>
      {clicking && (
        <>
          <div style={{
            position: "absolute", top: -20, left: -20, width: 40, height: 40,
            borderRadius: "50%",
            border: `2.5px solid rgba(79,70,229,${0.9 - (ripple as number) * 0.9})`,
            transform: `scale(${interpolate(ripple as number, [0, 1], [0.3, 2.8])})`,
          }} />
          <div style={{
            position: "absolute", top: -11, left: -11, width: 22, height: 22,
            borderRadius: "50%",
            background: `rgba(79,70,229,${0.5 - (ripple as number) * 0.5})`,
            transform: `scale(${interpolate(ripple as number, [0, 1], [0.5, 2.0])})`,
          }} />
        </>
      )}
      <svg width={30} height={36} viewBox="0 0 22 28" fill="none">
        <path
          d="M3 2L19 14L12 15.5L15 25L11.5 27L8.5 17.5L3 21V2Z"
          fill="white" stroke="#08090e" strokeWidth="1.5" strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
