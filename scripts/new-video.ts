#!/usr/bin/env node
/**
 * npm run new-video
 *
 * Self-served pipeline entry point. Given a target product's repo URL, this
 * script does the deterministic, mechanical scaffolding:
 *
 *   1. Prompts for product name (becomes the folder + brand wordmark)
 *   2. Prompts for the target repo URL (the product to demo)
 *   3. Prompts for the logo file (defaults to brand-logo.png in repo,
 *      override with any file path)
 *   4. Creates $DEMO_VIDEOS_ROOT/<name>/ (default ~/demo-videos/<name>/)
 *      by copying this template
 *   5. Clones the target repo into <name>/source-repo/ for PRD reading
 *   6. Copies the logo to <name>/public/brand/logo.png
 *   7. Pre-fills <name>/src/config.ts with brand colors from DESIGN.md
 *   8. Prints next-step instructions: hand off to the `/new-video` skill
 *      so the agent can read the PRD, write the business story, capture
 *      screenshots per SCREENSHOT.md, generate VO, and render.
 *
 * Creative / judgment-call work (business story, screen selection, VO
 * scripting) is intentionally delegated to the agent — see
 * .agents/skills/new-video/SKILL.md.
 *
 * Usage:
 *   npm run new-video
 *   npm run new-video -- --name=foo --repo=https://… --logo=/path/to/logo.png
 *     (any missing flag triggers an interactive prompt)
 */

import { existsSync, mkdirSync, cpSync, copyFileSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, basename, isAbsolute } from "node:path";
import { homedir } from "node:os";
import { execSync, spawnSync } from "node:child_process";
import * as readline from "node:readline/promises";

const TEMPLATE_ROOT = resolve(__dirname, "..");
// Where new video projects are created. Override with DEMO_VIDEOS_ROOT.
const DEMOS_ROOT = process.env.DEMO_VIDEOS_ROOT || join(homedir(), "demo-videos");

// ── arg parsing ─────────────────────────────────────────────────────────────
type Args = { name?: string; repo?: string; logo?: string; noClone?: boolean };
const args: Args = {};
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--name=")) args.name = a.slice(7);
  else if (a.startsWith("--repo=")) args.repo = a.slice(7);
  else if (a.startsWith("--logo=")) args.logo = a.slice(7);
  else if (a === "--no-clone") args.noClone = true;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function ask(prompt: string, fallback?: string): Promise<string> {
  const hint = fallback ? ` [${fallback}]` : "";
  const answer = (await rl.question(`${prompt}${hint}: `)).trim();
  return answer || fallback || "";
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function step(n: number, msg: string) {
  console.log(`\n[${n}] ${msg}`);
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("─".repeat(72));
  console.log("  new-video — self-served demo-video pipeline");
  console.log("─".repeat(72));
  console.log("  Reads:  DESIGN.md, RULES.md, SCREENSHOT.md, public/brand/logo.png");
  console.log(`  Writes: ${join(DEMOS_ROOT, "<name>")}/  (full Remotion project)`);
  console.log("─".repeat(72));

  // Validate template references
  for (const ref of ["DESIGN.md", "RULES.md", "SCREENSHOT.md", "public/brand/logo.png"] as const) {
    if (!existsSync(join(TEMPLATE_ROOT, ref))) {
      console.error(`\n✗ template missing ${ref} — fix the template before running new-video.`);
      process.exit(1);
    }
  }

  // 1. Product name
  step(1, "Product name");
  const rawName = args.name || await ask("  What is the name of the product you're demoing?");
  if (!rawName) { console.error("Name is required."); process.exit(1); }
  const name = slugify(rawName);
  const wordmarkRaw = await ask("  Brand wordmark to show on screen", rawName);
  // Split wordmark at first space for primary/accent
  const [primary, ...accentRest] = wordmarkRaw.split(/\s+/);
  const accent = accentRest.join(" ") || primary;
  const wordmarkPrimary = accentRest.length ? primary + " " : "";
  const wordmarkAccent = accentRest.length ? accent : primary;

  const outDir = join(DEMOS_ROOT, name);
  if (existsSync(outDir)) {
    const overwrite = await ask(`  ${outDir} already exists. Overwrite? [y/N]`, "n");
    if (overwrite.toLowerCase() !== "y") { console.log("Aborted."); process.exit(0); }
  }

  // 2. Repo URL
  step(2, "Target product repo");
  const repo = args.repo || await ask("  Git URL of the product to demo (use --no-clone to skip)");
  if (!repo && !args.noClone) {
    console.log("  (no repo URL — will skip clone; you can paste PRD manually later)");
  }

  // 3. Logo
  step(3, "Logo file");
  const defaultLogo = join(TEMPLATE_ROOT, "public/brand/logo.png");
  const logoInput = args.logo || await ask(`  Path to logo PNG/SVG`, defaultLogo);
  const logoPath = isAbsolute(logoInput) ? logoInput : resolve(process.cwd(), logoInput);
  if (!existsSync(logoPath)) {
    console.error(`  ✗ logo not found: ${logoPath}`);
    process.exit(1);
  }

  // ── 4. Scaffold ─────────────────────────────────────────────────────────
  step(4, `Scaffolding ${outDir}`);
  mkdirSync(DEMOS_ROOT, { recursive: true });

  // Copy template (skip node_modules, out/, .git)
  if (existsSync(outDir)) execSync(`rm -rf "${outDir}"`);
  mkdirSync(outDir, { recursive: true });

  const skip = new Set(["node_modules", "out", ".git", "source-repo"]);
  for (const entry of execSync(`ls -1A "${TEMPLATE_ROOT}"`, { encoding: "utf8" }).trim().split("\n")) {
    if (skip.has(entry)) continue;
    const src = join(TEMPLATE_ROOT, entry);
    const dst = join(outDir, entry);
    cpSync(src, dst, { recursive: true });
  }
  console.log(`  ✓ copied template → ${outDir}`);

  // ── 5. Logo ─────────────────────────────────────────────────────────────
  step(5, "Logo");
  const logoDst = join(outDir, "public/brand/logo.png");
  mkdirSync(join(outDir, "public/brand"), { recursive: true });
  copyFileSync(logoPath, logoDst);
  console.log(`  ✓ copied ${basename(logoPath)} → public/brand/logo.png`);

  // ── 6. Clone target repo ────────────────────────────────────────────────
  if (repo && !args.noClone) {
    step(6, `Cloning ${repo}`);
    const sourceDir = join(outDir, "source-repo");
    const r = spawnSync("git", ["clone", "--depth=1", repo, sourceDir], { stdio: "inherit" });
    if (r.status !== 0) {
      console.warn("  ! clone failed — continuing without source-repo. Paste PRD manually if needed.");
    } else {
      console.log(`  ✓ cloned into source-repo/`);
    }
  }

  // ── 7. Pre-fill config.ts with brand colors from DESIGN.md ───────
  step(7, "Pre-filling config.ts with brand colors + product name");
  const configPath = join(outDir, "src/config.ts");
  let config = readFileSync(configPath, "utf8");

  // Replace wordmark (handles both "Your Product" split and single-word)
  config = config.replace(
    /wordmark:\s*\{\s*primary:\s*"[^"]*",\s*accent:\s*"[^"]*"\s*\}/,
    `wordmark:      { primary: "${wordmarkPrimary}", accent: "${wordmarkAccent}" }`
  );
  // Replace closingPill (often the brand name)
  config = config.replace(
    /closingPill:\s*"[^"]*"/,
    `closingPill:   "${wordmarkRaw}."`
  );
  // Replace COLORS with design tokens (DESIGN.md primary set)
  config = config.replace(
    /export const COLORS = \{[\s\S]*?\} as const;/,
    `export const COLORS = {
  // From DESIGN.md — replace with your brand palette
  BG:           "#ffffff",        // ivory-white
  ACCENT:       "#4f46e5",        // brand accent (primary)
  ACCENT_SOFT:  "#6366f1",        // accent-400
  ACCENT_DEEP:  "#4338ca",        // accent-600
  ACCENT_ALT:   "#818cf8",        // accent-300 (secondary accent)
  DEEP:         "#1e1b4b",        // brand-deep
  TEXT_PRIMARY: "#2f2f2f",        // heading primary
  TEXT_BODY:    "#4d4d4d",        // body primary
  TEXT_STRONG:  "#111111",        // body strong
  TEXT_MUTED:   "#89898b",        // neutral-mid
} as const;`
  );
  writeFileSync(configPath, config);
  console.log(`  ✓ wordmark, closingPill, COLORS set`);
  console.log(`    (PROBLEM_LINES, SHIFT_PUNCH, SLIDES still placeholder — the agent fills these)`);

  // ── 8. Hand-off summary ─────────────────────────────────────────────────
  console.log("\n" + "─".repeat(72));
  console.log("  Scaffold complete. Hand off to the agent for the creative work.");
  console.log("─".repeat(72));
  console.log(`\n  Output: ${outDir}\n`);

  console.log("  Next steps (run from the new folder):");
  console.log(`    cd ${outDir}`);
  console.log("    npm install");
  console.log("");
  console.log("  Then, in Claude Code (or your agent of choice):");
  console.log(`    /new-video`);
  console.log("");
  console.log("  The skill will:");
  console.log("    1. Read source-repo/README + PRD + docs → write a business story");
  console.log("    2. Build a screen list from SCREENSHOT.md conventions");
  console.log("    3. Run take-screenshots.py to capture per-screen PNGs");
  console.log("    4. Generate VO via gen-voiceover.py from the story");
  console.log("    5. Fill SLIDES[] in src/config.ts with frame-accurate timing");
  console.log("    6. Run `npm run doctor` and `npm run lip-sync` before render");
  console.log("    7. `npm run render` → out/demo-v1.mp4");
  console.log("");
  console.log("  Reference docs in this folder:");
  console.log("    DESIGN.md       — brand design tokens (colors, type)");
  console.log("    RULES.md        — hard rules the doctor enforces");
  console.log("    SCREENSHOT.md   — screenshot capture spec");
  console.log("─".repeat(72));

  rl.close();
}

main().catch(e => {
  console.error(e);
  rl.close();
  process.exit(2);
});
