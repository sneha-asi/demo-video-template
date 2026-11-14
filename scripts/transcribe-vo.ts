#!/usr/bin/env node
/**
 * npm run transcribe
 *
 * Wraps `hyperframes media transcribe` (Whisper) to produce word-level
 * timestamps for every VO mp3 under public/voiceover/. Output:
 *   public/voiceover/<name>.json  →  { words: [{ text, start, end }, ...] }
 *
 * Feeds:
 *   - scripts/lip-sync-check.ts (verifies phrases land on real spoken words)
 *   - Future: auto-burned captions for silent-autoplay viewing
 *
 * Requires the @hyperframes/cli npx target. First run will pull Whisper
 * weights via the hyperframes-media skill's internal cache.
 */

import { readdirSync, existsSync } from "node:fs";
import { join, resolve, basename, extname } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(__dirname, "..");
const VO_DIR = join(ROOT, "public/voiceover");

if (!existsSync(VO_DIR)) {
  console.error(`No ${VO_DIR}. Nothing to transcribe.`);
  process.exit(0);
}

const mp3s = readdirSync(VO_DIR).filter(f => f.endsWith(".mp3"));
if (mp3s.length === 0) {
  console.log("No mp3s in public/voiceover/. Run gen-voiceover.py first.");
  process.exit(0);
}

let failed = 0;
for (const mp3 of mp3s) {
  const inPath = join(VO_DIR, mp3);
  const outPath = join(VO_DIR, basename(mp3, extname(mp3)) + ".json");

  if (existsSync(outPath)) {
    console.log(`= ${mp3} (already transcribed)`);
    continue;
  }

  console.log(`→ ${mp3}`);
  const r = spawnSync(
    "npx",
    [
      "-y", "-p", "@hyperframes/cli",
      "hyperframes", "media", "transcribe",
      "--input", inPath,
      "--output", outPath,
      "--format", "json-words",
    ],
    { stdio: "inherit" }
  );
  if (r.status !== 0) {
    failed++;
    console.error(`  ✗ failed (exit ${r.status})`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed to transcribe.`);
  process.exit(1);
}
console.log(`\n✓ ${mp3s.length} VO file(s) transcribed.`);
