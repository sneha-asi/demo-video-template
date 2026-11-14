#!/usr/bin/env node
/**
 * npm run transition -- <name> [duration_seconds]
 *
 * Render a transparent-background shader transition as a standalone mp4 using
 * Hyperframes' catalog. Output: public/transitions/<name>.mp4 — referenced
 * from a slide via `transitionIn: '<name>'`.
 *
 * Supported names (from @hyperframes/shader-transitions catalog):
 *   flash-through-white
 *   prism-shift
 *   crt-cut
 *   (add more by running `npx hyperframes add <name>` and adapting below)
 *
 * Default duration: 1.0s. Crossfade-style; sits between two acts.
 *
 * Examples:
 *   npm run transition -- flash-through-white
 *   npm run transition -- prism-shift 0.6
 */

import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "public/transitions");

const [name, durArg] = process.argv.slice(2);
if (!name) {
  console.error("Usage: npm run transition -- <name> [duration_seconds]");
  console.error("Example: npm run transition -- flash-through-white 1.0");
  process.exit(1);
}

const durationSec = durArg ? parseFloat(durArg) : 1.0;
if (!Number.isFinite(durationSec) || durationSec <= 0) {
  console.error(`Bad duration: ${durArg}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, `${name}.mp4`);

// Minimal Hyperframes composition for a transparent-bg shader transition.
// The shader name must match a `@hyperframes/shader-transitions` block.
const compositionHTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${name}</title>
  <style>
    html, body { margin: 0; padding: 0; background: transparent; }
    #stage { width: 1920px; height: 1080px; background: transparent; }
  </style>
</head>
<body>
  <div
    id="stage"
    data-composition-id="${name}-transition"
    data-start="0"
    data-width="1920"
    data-height="1080"
    data-duration="${durationSec}"
    data-fps="30"
    data-background="transparent"
  >
    <div
      class="hf-shader-transition"
      data-block="${name}"
      data-start="0"
      data-duration="${durationSec}"
      data-track-index="0"
    ></div>
  </div>
</body>
</html>`;

const work = join(tmpdir(), `hf-transition-${Date.now()}`);
mkdirSync(work, { recursive: true });
const htmlPath = join(work, "index.html");
writeFileSync(htmlPath, compositionHTML);

console.log(`→ Rendering ${name} (${durationSec}s) via Hyperframes…`);
const r = spawnSync(
  "npx",
  [
    "-y", "-p", "@hyperframes/cli",
    "hyperframes", "render",
    "--input", htmlPath,
    "--output", outPath,
    "--transparent",
    "--codec", "prores_ks", // Apple ProRes 4444 preserves alpha; falls back below if unsupported
  ],
  { stdio: "inherit", cwd: work }
);

// Cleanup tempdir best-effort
try { rmSync(work, { recursive: true, force: true }); } catch {}

if (r.status !== 0) {
  console.error("\n✗ Render failed. If your ffmpeg lacks prores_ks, retry with --codec webm-vp9.");
  process.exit(r.status ?? 1);
}

if (!existsSync(outPath)) {
  console.error(`\n✗ Expected output not found: ${outPath}`);
  process.exit(1);
}

console.log(`\n✓ Wrote ${outPath}`);
console.log(`  Use it from a slide: { transitionIn: "${name}" }`);
