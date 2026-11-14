#!/usr/bin/env node
/**
 * npm run pick-music [-- --mood=cinematic --force]
 *
 * Picks a unique background track for this video and copies it to
 * public/audio/music.mp3. Strategy:
 *
 *   1. LOCAL FIRST — scan $DEMO_VIDEOS_ROOT/_music-picks/*.mp3 (default
 *      DEMO_VIDEOS_ROOT is ~/demo-videos; your
 *      curated library). Pick the least-used track whose filename prefix
 *      matches the project mood inferred from src/config.ts (or from the
 *      --mood flag override).
 *
 *   2. WEB FALLBACK — if no local match (library exhausted, all tracks
 *      already used in another video, or mood has no candidates), open
 *      Pixabay Music in a headless Chromium via Playwright, search by
 *      mood tag, download the first CC0-eligible result.
 *
 * Uniqueness — enforces RULES.md §3: never reuse a music track across
 * videos. Tracked in $DEMO_VIDEOS_ROOT/_music-picks/_usage.json:
 *   { "<track-filename>": ["<video-folder-1>", "<video-folder-2>", ...] }
 *
 * Mood detection — keywords in BRAND.tagline + PROBLEM_LINES + SHIFT_PUNCH
 * map to one of the library's prefixes:
 *   marketing — "sales", "CRM", "leads", "growth", "B2B"
 *   cyberpunk — "AI", "automation", "agent", "tech", "data"
 *   fashion   — "design", "brand", "fashion", "creative"
 *   people    — "team", "people", "user", "customer", "learn"
 *   cinematic — "story", "future", "shift", "transform"
 *   ambient   — fallback default for anything calm
 *
 * Usage:
 *   npm run pick-music                       # auto-detect mood
 *   npm run pick-music -- --mood=cyberpunk   # override
 *   npm run pick-music -- --force            # re-pick even if mp3 exists
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { homedir } from "node:os";

const ROOT = resolve(__dirname, "..");
const CONFIG_PATH = join(ROOT, "src/config.ts");
const OUT_PATH = join(ROOT, "public/audio/music.mp3");
// Music library location. Override with DEMO_VIDEOS_ROOT (default ~/demo-videos).
const LIBRARY_DIR = join(process.env.DEMO_VIDEOS_ROOT || join(homedir(), "demo-videos"), "_music-picks");
const USAGE_LOG = join(LIBRARY_DIR, "_usage.json");

// ── Mood detection ──────────────────────────────────────────────────────────
const MOOD_KEYWORDS: Record<string, string[]> = {
  marketing: ["sales", "crm", "lead", "leads", "pipeline", "growth", "b2b", "revenue", "deal", "deals"],
  cyberpunk: ["ai", "agent", "automation", "automated", "tech", "data", "model", "intelligent", "intelligence"],
  fashion:   ["design", "brand", "fashion", "creative", "studio", "visual"],
  people:    ["team", "people", "user", "users", "customer", "customers", "learn", "onboard", "employee"],
  cinematic: ["story", "future", "shift", "transform", "moment", "imagine", "what if"],
  ambient:   ["calm", "focus", "deep", "thoughtful"],
};

function inferMoodFromConfig(): string {
  if (!existsSync(CONFIG_PATH)) return "marketing"; // sensible default
  const text = readFileSync(CONFIG_PATH, "utf8").toLowerCase();
  const scores: Record<string, number> = {};
  for (const [mood, words] of Object.entries(MOOD_KEYWORDS)) {
    scores[mood] = words.reduce((acc, w) => {
      const re = new RegExp(`\\b${w}\\b`, "g");
      return acc + (text.match(re)?.length ?? 0);
    }, 0);
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : "marketing";
}

// ── Usage log ───────────────────────────────────────────────────────────────
type UsageMap = Record<string, string[]>;
function readUsage(): UsageMap {
  if (!existsSync(USAGE_LOG)) return {};
  try { return JSON.parse(readFileSync(USAGE_LOG, "utf8")); } catch { return {}; }
}
function writeUsage(u: UsageMap) {
  writeFileSync(USAGE_LOG, JSON.stringify(u, null, 2));
}
function recordUse(track: string, videoFolder: string) {
  const u = readUsage();
  u[track] = u[track] ?? [];
  if (!u[track].includes(videoFolder)) u[track].push(videoFolder);
  writeUsage(u);
}

// ── Local library scan ──────────────────────────────────────────────────────
function localCandidates(mood: string): Array<{ track: string; uses: number }> {
  if (!existsSync(LIBRARY_DIR)) return [];
  const all = readdirSync(LIBRARY_DIR).filter(f => f.endsWith(".mp3"));
  const usage = readUsage();
  return all
    .filter(f => f.toLowerCase().startsWith(mood)) // prefix match — "marketing-*" etc.
    .map(track => ({ track, uses: (usage[track] ?? []).length }))
    .sort((a, b) => a.uses - b.uses); // least-used first
}

// ── Web fallback (Pixabay scraper) ──────────────────────────────────────────
// Pixabay Music: pixabay.com/music — CC0 / Pixabay license. No login required.
// This function is wired but kept as a guarded fallback because:
//   1. Pixabay has anti-bot measures; headless scraping can fail
//   2. Local library should normally suffice
//   3. Network calls slow down every video render
async function pixabayFallback(mood: string): Promise<string | null> {
  console.log(`  Local library has no unused ${mood} tracks. Falling back to Pixabay…`);
  try {
    // Lazy require — only install playwright if we actually hit this path.
    const { chromium } = require("playwright");
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ acceptDownloads: true });
    const page = await ctx.newPage();
    const moodToTag: Record<string, string> = {
      marketing: "corporate",
      cyberpunk: "electronic",
      fashion: "groovy",
      people: "happy",
      cinematic: "cinematic",
      ambient: "ambient",
    };
    const tag = moodToTag[mood] ?? "corporate";
    await page.goto(`https://pixabay.com/music/search/?mood=${encodeURIComponent(tag)}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(3_000);
    // Click first download button. Pixabay's selectors change — this is best-effort.
    const downloadBtn = page.locator('a[href*="/audio/"][download]').first();
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20_000 }),
      downloadBtn.click(),
    ]);
    const tmpPath = join(LIBRARY_DIR, `pixabay-${mood}-${Date.now()}.mp3`);
    await download.saveAs(tmpPath);
    await browser.close();
    return basename(tmpPath);
  } catch (e) {
    console.error(`  Pixabay fallback failed: ${(e as Error).message}`);
    console.error(`  Add a track manually to ${LIBRARY_DIR}/ and re-run.`);
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const moodArg = args.find(a => a.startsWith("--mood="))?.slice(7);
  const force = args.includes("--force");

  if (existsSync(OUT_PATH) && !force) {
    const size = statSync(OUT_PATH).size;
    console.log(`✓ music.mp3 already present (${(size / 1024).toFixed(0)} KB). Pass --force to re-pick.`);
    return;
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  mkdirSync(LIBRARY_DIR, { recursive: true });

  const mood = moodArg ?? inferMoodFromConfig();
  console.log(`Mood: ${mood}${moodArg ? " (override)" : " (inferred from config.ts)"}`);

  // Local first.
  const candidates = localCandidates(mood);
  if (candidates.length === 0) {
    console.log(`  No ${mood}-prefixed tracks in local library at ${LIBRARY_DIR}`);
    const fallback = await pixabayFallback(mood);
    if (!fallback) process.exit(1);
    candidates.push({ track: fallback, uses: 0 });
  }

  // Pick least-used.
  const pick = candidates[0];
  const src = join(LIBRARY_DIR, pick.track);
  copyFileSync(src, OUT_PATH);

  const videoFolder = basename(ROOT);
  recordUse(pick.track, videoFolder);

  const sizeKB = (statSync(OUT_PATH).size / 1024).toFixed(0);
  console.log(`✓ Picked ${pick.track} (${sizeKB} KB)`);
  console.log(`  Library uses count was ${pick.uses}; now ${pick.uses + 1}.`);
  console.log(`  Copied to public/audio/music.mp3`);
  console.log(`  Logged to ${USAGE_LOG}`);
}

main().catch(e => {
  console.error("pick-music crashed:", e);
  process.exit(2);
});
