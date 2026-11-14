import React from "react";
import { AbsoluteFill, Sequence, Series } from "remotion";
import { ProblemScene } from "./scenes/ProblemScene";
import { ShiftScene } from "./scenes/ShiftScene";
import { RevealScene } from "./scenes/RevealScene";
import { ScreenshotMontage } from "./scenes/ScreenshotMontage";
import { ClosingScene } from "./scenes/ClosingScene";
import { TransitionScene } from "./scenes/TransitionScene";
import { ACT_TRANSITIONS, SLIDES } from "./config";

// Beat math. All values in frames at 30 fps.
//   Problem ≈ 12 s  (3 lines × 4 s — set lower if you only have 2 lines)
//   Shift   ≈  3 s
//   Reveal  ≈  3 s
//   Montage = sum of SLIDES[i].duration
//   Closing ≈  5 s
const PROBLEM_FRAMES = 360;
const SHIFT_FRAMES   =  90;
const REVEAL_FRAMES  =  90;
const CLOSING_FRAMES = 150;

// Hyperframes shader transitions overlay the first 1s of an act.
const TRANSITION_FRAMES = 30;

const MONTAGE_FRAMES = SLIDES.reduce((acc, s) => acc + s.duration, 0);

export const VIDEO_DURATION_FRAMES =
  PROBLEM_FRAMES + SHIFT_FRAMES + REVEAL_FRAMES + MONTAGE_FRAMES + CLOSING_FRAMES;

/**
 * Renders an act with an optional 1s shader-transition overlay at its start.
 * The transition mp4 must exist at public/transitions/<name>.mp4 (rendered
 * via `npm run transition -- <name>`). If no transition is configured for
 * this act, just renders children.
 */
const ActWithTransition: React.FC<{
  transitionName?: string;
  children: React.ReactNode;
}> = ({ transitionName, children }) => (
  <AbsoluteFill>
    {children}
    {transitionName && (
      <Sequence from={0} durationInFrames={TRANSITION_FRAMES} layout="none">
        <TransitionScene name={transitionName} durationInFrames={TRANSITION_FRAMES} />
      </Sequence>
    )}
  </AbsoluteFill>
);

export const TemplateComposition: React.FC = () => (
  <AbsoluteFill>
    <Series>
      <Series.Sequence durationInFrames={PROBLEM_FRAMES}>
        <ProblemScene durationInFrames={PROBLEM_FRAMES} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHIFT_FRAMES}>
        <ActWithTransition transitionName={ACT_TRANSITIONS.shift}>
          <ShiftScene durationInFrames={SHIFT_FRAMES} />
        </ActWithTransition>
      </Series.Sequence>
      <Series.Sequence durationInFrames={REVEAL_FRAMES}>
        <ActWithTransition transitionName={ACT_TRANSITIONS.reveal}>
          <RevealScene durationInFrames={REVEAL_FRAMES} />
        </ActWithTransition>
      </Series.Sequence>
      <Series.Sequence durationInFrames={MONTAGE_FRAMES}>
        <ActWithTransition transitionName={ACT_TRANSITIONS.montage}>
          <ScreenshotMontage />
        </ActWithTransition>
      </Series.Sequence>
      <Series.Sequence durationInFrames={CLOSING_FRAMES}>
        <ActWithTransition transitionName={ACT_TRANSITIONS.closing}>
          <ClosingScene durationInFrames={CLOSING_FRAMES} />
        </ActWithTransition>
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
