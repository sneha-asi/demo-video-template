// ───────────────────────────────────────────────────────────────────────────
// Product-specific config. EDIT THIS FILE for a new video; touch nothing else.
//
// Set: brand colors + wordmark, problem-act lines, brand reveal text,
// slide list (image + audio + step badge + kinetic phrases + zoom hotspots),
// closing text. Drop matching files into public/screenshots, public/voiceover,
// public/audio.
// ───────────────────────────────────────────────────────────────────────────

import type { Hotspot, Phrase, ProblemLine, TransitionName } from "./types";

// ── Brand ───────────────────────────────────────────────────────────────────
export const BRAND = {
  wordmark:      { primary: "Your ", accent: "Product" },   // "Your Product"
  tagline:       "One line description of what the product does",
  closingPill:   "Your Product.",
  closingHead:   "Tagline that lands the close.",
  closingSub:    "Sub-headline reinforcing the value prop.",
} as const;

export const COLORS = {
  BG:           "#ffffff",
  ACCENT:       "#4f46e5",        // brand accent — replace with your brand color
  ACCENT_SOFT:  "#3b82f6",
  ACCENT_DEEP:  "#1d4ed8",
  TEXT_PRIMARY: "#0f172a",
  TEXT_BODY:    "#334155",
  TEXT_MUTED:   "#94a3b8",
} as const;

// ── Act 1 — Problem framing (each line gets ~4 s) ──────────────────────────
export const PROBLEM_LINES: ProblemLine[] = [
  { lead: "Today, every team has to deal with",
    punch: "Spreadsheets. Slack. Tickets. Tabs." },
  { lead: "Nobody has time to",
    punch: "Actually understand the data." },
  { lead: "Decisions are slower.",
    punch: "Errors slip through.",
    punchColor: "ACCENT_DEEP" },
];

// ── Act 2 — Shift / mid-hook (one short punch line) ────────────────────────
export const SHIFT_PUNCH = "What if AI did the heavy lifting?";

// ── Optional: shader transitions between acts (Hyperframes integration) ────
// Render the transition first: `npm run transition -- flash-through-white`.
// Then set the act name → transition name here. Plays as a 1s overlay at the
// START of that act. Leave the object empty {} to render with default
// crossfade only (the base behavior — nothing breaks if you skip this).
export const ACT_TRANSITIONS: {
  shift?:   TransitionName;
  reveal?:  TransitionName;
  montage?: TransitionName;
  closing?: TransitionName;
} = {
  // shift:   "flash-through-white",
  // reveal:  "prism-shift",
  // montage: "flash-through-white",
  // closing: "prism-shift",
};

// ── Act 4 — Montage slides (one entry per product screen) ──────────────────
//
// `img` resolves to public/screenshots/<img>. `audio` to public/voiceover/<audio>.
// `phrases` are the kinetic words shown on top of the screenshot, with frame
// offsets relative to the slide start. `hotspots` are camera positions (x,y in %)
// + zoom levels for the smooth pan/zoom — read README.md → "Hotspot grammar".
// `duration` is the slide length in frames at 30 fps.

export const SLIDES: Slide[] = [
  {
    step:     "1 · Setup",
    img:      "01-first-screen.png",
    audio:    "vo-slide-1.mp3",
    duration: 240,           // 8 s @ 30 fps — match to the audio file length
    flashes:  [195],          // optional: brief flash overlays at these frames
    phrases: [
      { text: "First message.",   frame: 0,   size: 84 },
      { text: "Second message.",  frame: 70,  size: 76 },
      { text: "Punch.",           frame: 165, color: "ACCENT", impact: true },
    ],
    hotspots: [
      { frame: 0,   x: 50, y: 50, zoom: 1.00 },
      { frame: 30,  x: 25, y: 30, zoom: 1.05 },
      { frame: 95,  x: 70, y: 60, zoom: 1.06 },
      { frame: 165, x: 50, y: 50, zoom: 1.10, punch: true },
    ],
  },
  // Duplicate this block per slide. Aim for 4–6 slides total per video.
];

export type Slide = {
  step: string;
  img: string;
  audio: string;
  duration: number;
  flashes?: number[];
  phrases: Phrase[];
  hotspots: Hotspot[];

  // ── Optional Hyperframes integrations ──
  // Render via `npm run transition -- <name>` first, then set this field.
  // Plays a 1s transparent-bg overlay at the start of the slide.
  transitionIn?: TransitionName;

  // Optional: play a Hyperframes-rendered mp4 (e.g. animated chart) instead
  // of `img`. File lives at public/screenshots/<video>. When set, `img` is
  // used as a fallback poster for the doctor's dimension check.
  video?: string;
};
