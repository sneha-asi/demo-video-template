import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { BG, ACCENT, ACCENT_DEEP, TEXT_PRIMARY, FONT } from "../constants";
import { SLIDES } from "../config";
import type { Slide } from "../config";
import type { Phrase } from "../types";

// ── Slide-to-slide crossfade overlap ───────────────────────────────────────
// Each slide's exit fade is 20 frames. Overlap the next slide's enter fade
// by ~18 frames so we get a clean crossfade instead of a brief blank gap.
const SLIDE_OVERLAP = 18;

const SLIDE_OFFSETS = SLIDES.reduce<number[]>((acc, _s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SLIDES[i - 1].duration - SLIDE_OVERLAP);
  return acc;
}, []);

export const MONTAGE_TOTAL =
  SLIDES.reduce((s, sl) => s + sl.duration, 0) - SLIDE_OVERLAP * (SLIDES.length - 1);

// ── Kinetic phrase strip (1–3 word punches synced to VO) ───────────────────
const KineticPhrase: React.FC<{ phrases: Phrase[]; duration: number }> = ({ phrases, duration }) => {
  const f = useCurrentFrame();
  const idx = phrases.reduce((best, p, i) => (p.frame <= f ? i : best), 0);
  const p = phrases[idx];
  const enter = interpolate(f - p.frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const next = phrases[idx + 1];
  const exit = next
    ? interpolate(f, [next.frame - 8, next.frame], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(f, [duration - 14, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = Math.min(enter, exit);
  const scale = p.impact ? interpolate(enter, [0, 1], [1.25, 1]) : 1;
  const colorMap: Record<string, string> = { ACCENT, ACCENT_DEEP };
  const color = p.color ? colorMap[p.color] : TEXT_PRIMARY;

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 80, textAlign: "center",
      fontFamily: FONT, fontWeight: 800, color,
      fontSize: p.size ?? 76, letterSpacing: -1, lineHeight: 1.1,
      opacity: o, transform: `translateY(${(1 - enter) * 14}px) scale(${scale})`,
      transformOrigin: "bottom center",
    }}>
      {p.text}
    </div>
  );
};

// ── Zoom math (drives smooth camera pan/zoom across hotspots) ──────────────
function zoomT(cx: number, cy: number, s: number): string {
  const hx = (cx / 100) * 1920;
  const hy = (cy / 100) * 1080;
  return `translate(${960 - s * hx}px,${540 - s * hy}px) scale(${s})`;
}

const SlideCard: React.FC<Slide> = ({ img, audio, step, phrases, hotspots, duration }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const idx = hotspots.reduce((best, hs, i) => (hs.frame <= f ? i : best), 0);
  const from = hotspots[idx];
  const to   = hotspots[idx + 1];
  const elapsed = f - from.frame;

  const camFx = from.camX ?? from.x;
  const camFy = from.camY ?? from.y;
  const camTx = to ? (to.camX ?? to.x) : camFx;
  const camTy = to ? (to.camY ?? to.y) : camFy;

  const zCfg = to?.punch
    ? { damping: 11, stiffness: 440, mass: 0.32 }
    : { damping: 18, stiffness: 240, mass: 0.45 };
  const zT = to ? spring({ frame: elapsed, fps, config: zCfg, from: 0, to: 1 }) : 1;

  const cx = to ? interpolate(zT as number, [0, 1], [camFx, camTx]) : camFx;
  const cy = to ? interpolate(zT as number, [0, 1], [camFy, camTy]) : camFy;
  const s  = to ? interpolate(zT as number, [0, 1], [from.zoom, to.zoom]) : from.zoom;

  const enter = spring({ frame: f, fps, config: { damping: 30, stiffness: 260 }, from: 0, to: 1 });
  const exit  = f > duration - 20
    ? spring({ frame: f - (duration - 20), fps, config: { damping: 30, stiffness: 300 }, from: 0, to: 1 })
    : 0;
  const alpha = Math.min(enter as number, 1 - (exit as number));

  return (
    <AbsoluteFill style={{ background: BG, opacity: alpha }}>
      <Audio src={staticFile(`voiceover/${audio}`)} volume={0.95} />

      {/* Step badge — top-left */}
      <div style={{
        position: "absolute", top: 32, left: 32, zIndex: 4,
        background: ACCENT, color: "white",
        padding: "8px 18px", borderRadius: 999,
        fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: 0.5, textTransform: "uppercase",
      }}>
        {step}
      </div>

      {/* Screenshot with smooth camera */}
      <div style={{
        position: "absolute", inset: 0,
        transform: zoomT(cx, cy, s),
        transformOrigin: "0 0",
        willChange: "transform",
      }}>
        <Img src={staticFile(`screenshots/${img}`)}
             style={{ width: 1920, height: 1080, display: "block", objectFit: "cover" }} />
      </div>

      {/* Soft fade strip at the bottom so kinetic phrase stays readable */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 220,
        background: "linear-gradient(to top, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.85) 60%, transparent 100%)",
        pointerEvents: "none", zIndex: 5,
      }} />

      <KineticPhrase phrases={phrases} duration={duration} />
    </AbsoluteFill>
  );
};

export const ScreenshotMontage: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    {SLIDES.map((slide, i) => (
      <Sequence key={`${slide.step}-${i}`} from={SLIDE_OFFSETS[i]} durationInFrames={slide.duration + 22}>
        <SlideCard {...slide} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
