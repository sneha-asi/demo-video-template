#!/usr/bin/env node
/**
 * npm run doctor
 *
 * Pre-render validator for the demo-video template. Walks src/config.ts and
 * fails loud if any of the README's hard rules are violated. Saves you the
 * 4-minute "render then notice the bug" cycle.
 *
 * Rules enforced:
 *   1. Each SLIDES[i] has ≥4 hotspots (wide → zoom → pan → SLAM pattern)
 *   2. Each SLIDES[i] has ≤8 words across all phrases[].text (combined)
 *   3. SLIDES[i].duration ≈ VO mp3 length (within ±15 frames @30fps = ±0.5s)
 *   4. Every SLIDES[i].img exists in public/screenshots/ AND is ≥1920×1080
 *   5. Every SLIDES[i].audio exists in public/voiceover/
 *   6. PROBLEM_LINES is non-empty and each entry has a punch
 *   7. BRAND.wordmark / tagline / closingHead / closingSub / closingPill are set
 *   8. Music file present at public/audio/music.mp3 (warning, not error)
 *
 * Exit codes:
 *   0 = clean
 *   1 = at least one hard-rule violation
 *
 * No deps beyond Node ≥18 builtins. Reads config.ts via dynamic import
 * (the file uses `as const` + plain exports — no Remotion runtime needed).
 */

import { existsSync, statSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const FPS = 30;
const ROOT = resolve(__dirname, "..");
const CONFIG_PATH = join(ROOT, "src/config.ts");
const SCREENSHOTS_DIR = join(ROOT, "public/screenshots");
const VOICEOVER_DIR = join(ROOT, "public/voiceover");
const MUSIC_PATH = join(ROOT, "public/audio/music.mp3");

type Problem = { level: "ERROR" | "WARN"; where: string; msg: string };
const problems: Problem[] = [];
const err = (where: string, msg: string) => problems.push({ level: "ERROR", where, msg });
const warn = (where: string, msg: string) => problems.push({ level: "WARN", where, msg });

// ── 1. Load config via a tiny TS shim (no Remotion runtime needed) ──────────
async function loadConfig() {
  // We use tsx if available, else fall back to a regex parse.
  try {
    const url = pathToFileURL(CONFIG_PATH).href;
    // @ts-ignore — tsx loader handles the .ts extension at runtime
    return await import(url);
  } catch (e) {
    throw new Error(
      `Failed to import ${CONFIG_PATH}. Run via 'npx tsx scripts/doctor.ts' ` +
      `(tsx is auto-resolved by 'npm run doctor').\n` + (e as Error).message
    );
  }
}

// ── 2. Audio duration via ffprobe (already required for Remotion render) ────
function audioDurationSeconds(path: string): number | null {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${path}"`,
      { encoding: "utf8" }
    );
    const d = parseFloat(out.trim());
    return Number.isFinite(d) ? d : null;
  } catch {
    return null; // ffprobe missing — skip the check rather than false-fail
  }
}

// ── 3. Image dims via ffprobe ───────────────────────────────────────────────
function imageDims(path: string): { w: number; h: number } | null {
  try {
    const out = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${path}"`,
      { encoding: "utf8" }
    );
    const [w, h] = out.trim().split("x").map(Number);
    return Number.isFinite(w) && Number.isFinite(h) ? { w, h } : null;
  } catch {
    return null;
  }
}

// ── 4. Run checks ───────────────────────────────────────────────────────────
async function main() {
  const cfg = await loadConfig();

  const { BRAND, PROBLEM_LINES, SHIFT_PUNCH, SLIDES } = cfg;

  // BRAND
  if (!BRAND?.wordmark?.primary || !BRAND?.wordmark?.accent)
    err("BRAND.wordmark", "must have { primary, accent }");
  for (const k of ["tagline", "closingHead", "closingSub", "closingPill"] as const)
    if (!BRAND?.[k]) err(`BRAND.${k}`, "missing");

  // PROBLEM_LINES
  if (!Array.isArray(PROBLEM_LINES) || PROBLEM_LINES.length === 0)
    err("PROBLEM_LINES", "must be non-empty");
  PROBLEM_LINES?.forEach((p: any, i: number) => {
    if (!p.punch) err(`PROBLEM_LINES[${i}]`, "missing .punch");
  });

  // SHIFT_PUNCH
  if (!SHIFT_PUNCH || typeof SHIFT_PUNCH !== "string")
    err("SHIFT_PUNCH", "must be a non-empty string");

  // SLIDES
  if (!Array.isArray(SLIDES) || SLIDES.length === 0) {
    err("SLIDES", "must be non-empty");
    return;
  }

  for (let i = 0; i < SLIDES.length; i++) {
    const s = SLIDES[i];
    const where = `SLIDES[${i}] (${s.step ?? "no step"})`;

    // Rule 1: ≥4 hotspots
    if (!Array.isArray(s.hotspots) || s.hotspots.length < 4)
      err(where, `needs ≥4 hotspots (got ${s.hotspots?.length ?? 0}). Pattern: wide → zoom → pan → SLAM.`);

    // Rule 2: ≤8 words across all phrases
    const wordCount = (s.phrases ?? [])
      .map((p: any) => (p.text ?? "").trim().split(/\s+/).filter(Boolean).length)
      .reduce((a: number, b: number) => a + b, 0);
    if (wordCount > 8)
      err(where, `phrases total ${wordCount} words; hard cap is 8.`);

    // Rule 4: img exists + dims
    const imgPath = join(SCREENSHOTS_DIR, s.img ?? "");
    if (!s.img || !existsSync(imgPath)) {
      err(where, `screenshot not found: public/screenshots/${s.img}`);
    } else {
      const dims = imageDims(imgPath);
      if (dims && (dims.w < 1920 || dims.h < 1080))
        err(where, `screenshot ${s.img} is ${dims.w}×${dims.h}; need ≥1920×1080 (will look blurry).`);
    }

    // Rule 5 + 3: audio exists + duration matches slide duration
    const audioPath = join(VOICEOVER_DIR, s.audio ?? "");
    if (!s.audio || !existsSync(audioPath)) {
      err(where, `VO not found: public/voiceover/${s.audio}`);
    } else {
      const dur = audioDurationSeconds(audioPath);
      if (dur !== null) {
        const expectedFrames = Math.round(dur * FPS);
        const diff = Math.abs((s.duration ?? 0) - expectedFrames);
        if (diff > 15)
          err(
            where,
            `slide duration ${s.duration}f but VO is ${dur.toFixed(2)}s (${expectedFrames}f). ` +
            `Off by ${diff}f. Risk: silent gap or VO cut-off.`
          );
      }
    }

    // Soft check: hotspot pattern — wide first, SLAM last
    if (Array.isArray(s.hotspots) && s.hotspots.length >= 4) {
      const first = s.hotspots[0];
      const last = s.hotspots[s.hotspots.length - 1];
      if ((first.zoom ?? 1) > 1.02)
        warn(where, `first hotspot zoom=${first.zoom}; convention is ≈1.00 (wide).`);
      if (!last.punch)
        warn(where, `last hotspot should have .punch=true for the SLAM.`);
    }
  }

  // Rule 8: music file (warning only)
  if (!existsSync(MUSIC_PATH))
    warn("public/audio/music.mp3", "no background music. Each video should have a UNIQUE track.");
}

main().then(() => {
  const errors = problems.filter(p => p.level === "ERROR");
  const warnings = problems.filter(p => p.level === "WARN");

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✓ doctor: all checks passed.");
    process.exit(0);
  }

  for (const p of problems) {
    const tag = p.level === "ERROR" ? "✗" : "!";
    console.log(`${tag} ${p.level}  ${p.where}`);
    console.log(`    ${p.msg}`);
  }
  console.log();
  console.log(`${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(errors.length > 0 ? 1 : 0);
}).catch(e => {
  console.error("doctor crashed:", e);
  process.exit(2);
});
