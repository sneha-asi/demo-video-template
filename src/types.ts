// Shared types referenced by config.ts + scenes.

export type ProblemLine = {
  lead?: string;          // smaller setup phrase, e.g. "Today, every team..."
  punch: string;          // big bold line, e.g. "Spreadsheets. Slack. Tickets."
  punchColor?: "ACCENT" | "ACCENT_DEEP" | "TEXT_PRIMARY";
};

export type Phrase = {
  text: string;
  frame: number;          // relative to slide start
  size?: number;          // font-size in px (default 76)
  color?: "ACCENT" | "ACCENT_DEEP";
  impact?: boolean;       // if true, gets a "slam" entrance + larger scale
};

export type Hotspot = {
  frame: number;          // when this hotspot becomes the active camera target
  x: number;              // 0–100 (% of image width); camera centers here
  y: number;              // 0–100 (% of image height)
  camX?: number;          // optional override for the camera-only X (vs cursor X)
  camY?: number;
  zoom: number;           // 1.0 = full image, 1.1 = mild zoom, 1.3 = heavy
  punch?: boolean;        // last hotspot uses a punchier spring for the SLAM
};

// ── Optional Hyperframes integrations ───────────────────────────────────────
// These fields are opt-in. The base 5-act render works without them.
// See README.md → "Optional Hyperframes integrations".

/**
 * Named shader transition rendered by `npm run transition -- <name>`.
 * The mp4 must exist at `public/transitions/<name>.mp4` before render.
 * Played at the start of the slide as a 1s overlay.
 */
export type TransitionName =
  | "flash-through-white"
  | "prism-shift"
  | "crt-cut"
  | (string & {}); // allow custom names without losing autocomplete on the known ones
