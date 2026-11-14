#!/usr/bin/env node
/**
 * npm run lip-sync
 *
 * For every SLIDES[i].phrases entry, verify the kinetic phrase is actually
 * spoken in the VO at phrases[i].frame ± LIP_SYNC_TOLERANCE_FRAMES. Uses the
 * JSON output of `npm run transcribe`.
 *
 * Catches the most common gotcha from CHEATSHEET.md: phrases drift from the
 * VO during edits — the visual says "Covered." while the VO says
 * "fully handled." Reviewers notice. Clients notice.
 *
 * Exit:
 *   0 = every phrase lands on its spoken word(s)
 *   1 = at least one phrase missing or mis-timed
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve, basename, extname } from "node:path";
import { pathToFileURL } from "node:url";

const FPS = 30;
const LIP_SYNC_TOLERANCE_FRAMES = 15; // ±0.5 s — generous; tighten if too loose

const ROOT = resolve(__dirname, "..");
const CONFIG_PATH = join(ROOT, "src/config.ts");
const VO_DIR = join(ROOT, "public/voiceover");

type Word = { text: string; start: number; end: number };

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function findPhraseAt(words: Word[], target: string, expectedSec: number): { matched: boolean; actualSec?: number; diffSec?: number } {
  const targetWords = normalize(target).split(" ").filter(Boolean);
  if (targetWords.length === 0) return { matched: false };

  // Slide a window of size targetWords.length across the transcript.
  let bestStart = -1;
  let bestDiff = Infinity;
  for (let i = 0; i <= words.length - targetWords.length; i++) {
    const slice = words.slice(i, i + targetWords.length);
    const sliceText = slice.map(w => normalize(w.text)).join(" ");
    if (sliceText === targetWords.join(" ")) {
      const diff = Math.abs(slice[0].start - expectedSec);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestStart = slice[0].start;
      }
    }
  }
  if (bestStart < 0) return { matched: false };
  return {
    matched: true,
    actualSec: bestStart,
    diffSec: bestStart - expectedSec,
  };
}

async function main() {
  const cfg = await import(pathToFileURL(CONFIG_PATH).href);
  const SLIDES = (cfg as any).SLIDES as any[];

  if (!Array.isArray(SLIDES)) {
    console.error("SLIDES not exported from config.ts");
    process.exit(2);
  }

  let errors = 0;
  let checked = 0;

  for (let i = 0; i < SLIDES.length; i++) {
    const s = SLIDES[i];
    const where = `SLIDES[${i}] (${s.step ?? ""})`;

    const jsonPath = join(VO_DIR, basename(s.audio, extname(s.audio)) + ".json");
    if (!existsSync(jsonPath)) {
      console.log(`! ${where}: no transcript at ${jsonPath}. Run 'npm run transcribe' first.`);
      continue;
    }

    const transcript = JSON.parse(readFileSync(jsonPath, "utf8")) as { words: Word[] };
    if (!transcript?.words?.length) {
      console.log(`! ${where}: transcript empty for ${s.audio}.`);
      continue;
    }

    for (const p of s.phrases ?? []) {
      checked++;
      const expectedSec = p.frame / FPS;
      const result = findPhraseAt(transcript.words, p.text, expectedSec);

      if (!result.matched) {
        errors++;
        console.log(`✗ ${where}: phrase "${p.text}" @${p.frame}f — NOT spoken in VO. Paraphrase or remove.`);
        continue;
      }
      const diffFrames = Math.round((result.diffSec ?? 0) * FPS);
      if (Math.abs(diffFrames) > LIP_SYNC_TOLERANCE_FRAMES) {
        errors++;
        console.log(
          `✗ ${where}: phrase "${p.text}" set to frame ${p.frame} ` +
          `but VO says it at ~${(result.actualSec ?? 0).toFixed(2)}s ` +
          `(frame ${Math.round((result.actualSec ?? 0) * FPS)}). Off by ${diffFrames}f.`
        );
      } else {
        console.log(`✓ ${where}: "${p.text}" lands ${diffFrames >= 0 ? "+" : ""}${diffFrames}f`);
      }
    }
  }

  console.log(`\n${checked} phrase(s) checked, ${errors} issue(s).`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(e => {
  console.error("lip-sync crashed:", e);
  process.exit(2);
});
